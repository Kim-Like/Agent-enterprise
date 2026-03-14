PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS samlino_projects (
    id TEXT PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_crawl_pages (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES samlino_projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    status_code INTEGER,
    robots_directive TEXT,
    indexability TEXT,
    canonical_url TEXT,
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    word_count INTEGER,
    main_keyword TEXT,
    secondary_keywords TEXT,
    target_questions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, url)
);

CREATE TABLE IF NOT EXISTS samlino_crawl_links (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES samlino_projects(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    destination_url TEXT NOT NULL,
    anchor_text TEXT,
    is_external INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER,
    is_follow INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_keyword_annotations (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES samlino_projects(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    main_keyword TEXT,
    secondary_keywords TEXT,
    target_questions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(project_id, url)
);

CREATE TABLE IF NOT EXISTS samlino_schema_generations (
    id TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    canonical_url TEXT,
    page_title TEXT,
    schema_type TEXT NOT NULL,
    schema_json TEXT NOT NULL,
    author_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_author_profiles (
    id TEXT PRIMARY KEY,
    profile_url TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    role TEXT,
    bio TEXT,
    social_links_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_prototypes (
    id TEXT PRIMARY KEY,
    component_name TEXT NOT NULL,
    target_page TEXT,
    placement TEXT,
    requirements TEXT,
    html TEXT NOT NULL,
    css TEXT,
    js TEXT,
    meta_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_skill_overrides (
    id TEXT PRIMARY KEY,
    specialist_id TEXT NOT NULL,
    scope_key TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'workspace',
    enabled INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(specialist_id, scope_key)
);

CREATE TABLE IF NOT EXISTS samlino_ops_audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    details_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS samlino_migration_audit (
    id TEXT PRIMARY KEY,
    migration_name TEXT NOT NULL,
    status TEXT NOT NULL,
    details_json TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_samlino_projects_slug ON samlino_projects(slug);
CREATE INDEX IF NOT EXISTS idx_samlino_pages_project_url ON samlino_crawl_pages(project_id, url);
CREATE INDEX IF NOT EXISTS idx_samlino_links_project ON samlino_crawl_links(project_id);
CREATE INDEX IF NOT EXISTS idx_samlino_schema_created ON samlino_schema_generations(created_at);
CREATE INDEX IF NOT EXISTS idx_samlino_ops_created ON samlino_ops_audit_log(created_at);
