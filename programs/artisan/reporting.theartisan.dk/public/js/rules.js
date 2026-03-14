function qs(id) {
  return document.getElementById(id);
}

function setText(id, text) {
  var node = qs(id);
  if (node) node.textContent = text;
}

function dkk(value) {
  return Number(value || 0).toLocaleString('da-DK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function groupHintFromAccountNo(accountNo) {
  if (accountNo === '1211') return 'cafe';
  if (accountNo === '1815') return 'admin';
  if (accountNo === '1540') return 'fixed';
  return 'cafe';
}

async function syncAccounts() {
  setText('sync-status', 'Syncing accounts...');
  const res = await fetch('/api/accounts/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'sync failed');

  setText('sync-last-at', data.synced_at || 'n/a');
  if (data.summary) {
    setText('sync-total-accounts', String(data.summary.total_accounts || 0));
    setText('sync-mapped-accounts', String(data.summary.mapped_accounts || 0));
    setText('sync-unmapped-accounts', String(data.summary.unmapped_accounts || 0));
  }
  setText('sync-status', 'Sync complete');
}

function renderRules(rules) {
  var body = qs('rules-table-body');
  if (!body) return;
  body.innerHTML = '';
  (rules || []).forEach(function(rule) {
    var tr = document.createElement('tr');
    tr.setAttribute('data-rule-id', String(rule.id));
    tr.innerHTML = ''
      + '<td>' + rule.id + '</td>'
      + '<td>' + rule.account_no + '</td>'
      + '<td>' + rule.group_key + '</td>'
      + '<td>' + rule.category_name + '</td>'
      + '<td class="mono">' + rule.supplier_pattern + '</td>'
      + '<td>' + rule.match_type + '</td>'
      + '<td>' + rule.priority + '</td>'
      + '<td><input type="checkbox" class="rule-enabled-toggle" ' + (rule.enabled ? 'checked' : '') + '></td>'
      + '<td><button class="btn btn-danger btn-small delete-rule-btn">Delete</button></td>';
    body.appendChild(tr);
  });
}

async function loadRules() {
  const res = await fetch('/api/supplier-rules');
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to load rules');
  renderRules(data.rules || []);
}

async function createRule() {
  const payload = {
    account_no: (qs('rule-account-no').value || '').trim(),
    group_key: qs('rule-group-key').value,
    category_name: (qs('rule-category-name').value || '').trim(),
    supplier_pattern: (qs('rule-supplier-pattern').value || '').trim(),
    match_type: qs('rule-match-type').value,
    priority: Number(qs('rule-priority').value || 100),
    enabled: true,
  };
  if (!payload.account_no || !payload.category_name || !payload.supplier_pattern) {
    throw new Error('account, category, and supplier pattern are required');
  }
  const res = await fetch('/api/supplier-rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to create rule');
  setText('create-rule-status', 'Rule created');
  await loadRules();
}

async function patchRule(ruleId, payload) {
  const res = await fetch('/api/supplier-rules/' + ruleId, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to update rule');
  return data.rule;
}

async function deleteRule(ruleId) {
  const res = await fetch('/api/supplier-rules/' + ruleId, { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to delete rule');
  return data.ok;
}

function renderSuggestions(items) {
  var body = qs('suggestions-body');
  if (!body) return;
  body.innerHTML = '';
  (items || []).forEach(function(item) {
    var tr = document.createElement('tr');
    tr.innerHTML = ''
      + '<td>' + item.supplier_name + '</td>'
      + '<td>' + item.account_no + '</td>'
      + '<td class="mono">' + dkk(item.total_amount) + '</td>'
      + '<td>' + item.occurrences + '</td>'
      + '<td><button class="btn btn-small use-suggestion-btn" '
      + 'data-account="' + item.account_no + '" '
      + 'data-supplier="' + item.supplier_name.replace(/"/g, '&quot;') + '">Use</button></td>';
    body.appendChild(tr);
  });
}

async function loadSuggestions() {
  const accountNo = (qs('suggest-account-no').value || '').trim();
  const period = qs('suggest-period').value;
  const offset = Number(qs('suggest-offset').value || 0);
  const params = new URLSearchParams();
  if (accountNo) params.set('account_no', accountNo);
  params.set('period', period);
  params.set('offset', String(offset));

  setText('suggestions-status', 'Loading suggestions...');
  const res = await fetch('/api/supplier-rules/suggestions?' + params.toString());
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'failed to load suggestions');

  renderSuggestions(data.suggestions || []);
  setText('suggestions-status', (data.suggestions || []).length + ' suggestions loaded');
}

document.addEventListener('DOMContentLoaded', function() {
  var syncBtn = qs('sync-accounts-btn');
  if (syncBtn) {
    syncBtn.addEventListener('click', async function() {
      syncBtn.disabled = true;
      try {
        await syncAccounts();
      } catch (err) {
        setText('sync-status', err.message || String(err));
      } finally {
        syncBtn.disabled = false;
      }
    });
  }

  var createBtn = qs('create-rule-btn');
  if (createBtn) {
    createBtn.addEventListener('click', async function() {
      createBtn.disabled = true;
      try {
        await createRule();
      } catch (err) {
        setText('create-rule-status', err.message || String(err));
      } finally {
        createBtn.disabled = false;
      }
    });
  }

  var rulesTable = qs('rules-table');
  if (rulesTable) {
    rulesTable.addEventListener('click', async function(evt) {
      var deleteBtn = evt.target.closest('.delete-rule-btn');
      if (deleteBtn) {
        var row = deleteBtn.closest('tr');
        var ruleId = row && row.getAttribute('data-rule-id');
        if (!ruleId) return;
        if (!confirm('Delete this supplier rule?')) return;
        try {
          await deleteRule(ruleId);
          await loadRules();
        } catch (err) {
          alert(err.message || String(err));
        }
      }

      var useBtn = evt.target.closest('.use-suggestion-btn');
      if (useBtn) {
        var account = useBtn.getAttribute('data-account') || '';
        var supplier = useBtn.getAttribute('data-supplier') || '';
        qs('rule-account-no').value = account;
        qs('rule-group-key').value = groupHintFromAccountNo(account);
        qs('rule-supplier-pattern').value = supplier;
        qs('rule-match-type').value = 'contains';
        qs('rule-category-name').focus();
      }
    });

    rulesTable.addEventListener('change', async function(evt) {
      var toggle = evt.target.closest('.rule-enabled-toggle');
      if (!toggle) return;
      var row = toggle.closest('tr');
      var ruleId = row && row.getAttribute('data-rule-id');
      if (!ruleId) return;
      try {
        await patchRule(ruleId, { enabled: !!toggle.checked });
      } catch (err) {
        toggle.checked = !toggle.checked;
        alert(err.message || String(err));
      }
    });
  }

  var suggestionsBtn = qs('load-suggestions-btn');
  if (suggestionsBtn) {
    suggestionsBtn.addEventListener('click', async function() {
      suggestionsBtn.disabled = true;
      try {
        await loadSuggestions();
      } catch (err) {
        setText('suggestions-status', err.message || String(err));
      } finally {
        suggestionsBtn.disabled = false;
      }
    });
  }
});
