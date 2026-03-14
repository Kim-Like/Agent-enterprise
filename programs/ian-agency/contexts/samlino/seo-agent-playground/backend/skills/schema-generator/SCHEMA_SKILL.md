---
name: schema-markup-comparaja
description: "Use this skill whenever generating, auditing, or optimizing Schema Markup / structured data for ComparaJá.pt pages. Triggers include: any mention of 'schema', 'structured data', 'JSON-LD', 'rich results', 'rich snippets', 'schema.org', or requests related to SEO markup for comparison pages, simulators, financial articles, product verticals (crédito habitação, seguros, energia, telecomunicações, cartões), author/contributor schemas, E-E-A-T signals, or YMYL compliance. Also use when the user asks to generate schema for a new page, audit existing markup, fix Rich Results Test errors, add author/reviewer credentials, or build Dataset schemas for financial data tables. Use this skill even if the user simply says 'add schema to this page' or 'create the structured data'. Do NOT use for general HTML/CSS, Open Graph tags, robots.txt, or sitemaps."
---

# Schema Markup for ComparaJá.pt — YMYL Financial Comparison Platform

## Overview

ComparaJá.pt is a regulated financial intermediary (authorized by Banco de Portugal) operating as a comparison and simulation platform for financial products and essential services in Portugal. Every page falls under Google's YMYL (Your Money or Your Life) classification, which means E-E-A-T signals in structured data are critical for search visibility and AI citation eligibility.

This skill generates production-ready JSON-LD schema markup tailored for ComparaJá's page types, entity-linking conventions, and E-E-A-T requirements.

## Critical Rules

1. **Always use JSON-LD format.** Google's recommended and preferred format.
2. **Only mark up content visible on the page.** Never fabricate reviews, ratings, or data. Google considers hidden markup misleading — particularly dangerous for YMYL sites where a manual action would be devastating.
3. **Use `@id` for entity linking.** Every reusable entity (Organization, Person, WebPage, Service) gets an `@id` so other schemas can reference it without duplication. This is central to ComparaJá's architecture.
4. **Always include E-E-A-T Person schemas** for authors, contributors, and reviewers on article and comparison pages. These are the highest-impact YMYL signals.
5. **All dates use ISO 8601 with Lisbon timezone:** `+00:00` (WET) or `+01:00` (WEST, summer). Portugal uses WET/WEST.
6. **Language is always `pt-PT`** unless explicitly otherwise.
7. **Currency is always `EUR`** for financial schemas.
8. **Fill all required AND recommended properties.** Incomplete schemas waste crawl budget without earning rich results.

## Deprecated Schema Types — Do NOT Generate

Google retired these in 2025. They no longer trigger rich results:

| Deprecated Type | Note |
|---|---|
| HowTo | Fully phased out on desktop and mobile |
| FAQPage | Restricted to government and health authority sites only — ComparaJá is NOT eligible |
| ClaimReview | Removed from rich results |
| Estimated Salary | No longer displayed |
| Learning Video | Replaced by standard VideoObject |
| SpecialAnnouncement | COVID-era, no longer relevant |
| Vehicle Listing | Auto dealer specific, removed |
| PracticeProblem | Educational, removed |
| Book Actions | Publisher specific, removed |
| Course Info (old) | Replaced by updated Course schema |

If a user requests FAQPage schema, explain that ComparaJá is not eligible since the 2025 restriction and suggest using `mainEntity` Q&A patterns within Article or WebPage schema instead for semantic benefit (even without the rich result).

## ComparaJá Entity Linking Convention

Every reusable entity uses a consistent `@id` pattern. This is the backbone of the schema architecture — it allows any schema block to reference an entity by ID without repeating its full definition.

### Standard `@id` Patterns

```
Organization:   https://www.comparaja.pt/#organization
WebSite:        https://www.comparaja.pt/#website
WebPage:        https://www.comparaja.pt/{path}/#webpage
Service:        https://www.comparaja.pt/{path}/#service
Dataset:        https://www.comparaja.pt/{path}#{dataset-slug}
Person:         https://www.comparaja.pt/sobre-nos/{slug}/#person
```

**Note:** BreadcrumbList is NOT part of the schema architecture — breadcrumbs are generated in application code. Never include BreadcrumbList in JSON-LD output.

When an entity is defined in full in one schema block, other blocks should reference it by `@id` only:

```json
"publisher": {
  "@type": "Organization",
  "@id": "https://www.comparaja.pt/#organization"
}
```

This avoids duplication and keeps the `@graph` clean.

---

## ComparaJá Page Types & Schema Mapping

| Page Type | Primary Schema | Supporting Schemas |
|---|---|---|
| Comparison/simulator landing | `WebPage` + `Service` | Organization, Person (author/reviewer), Dataset (if page has comparative data tables) |
| Financial article / guide | `WebPage` + `Article` | Organization, Person (author/contributor/reviewer), Dataset (if page has comparative data tables) |
| Product vertical hub (e.g., /credito-habitacao) | `WebPage` + `Service` | Organization, Person |
| About/team page | `WebPage` + `Organization` | Person (team members) |
| Homepage | `WebSite` + `Organization` | SearchAction (sitelinks) |

Every page should include at minimum: **Organization** (by `@id` reference) and **WebPage**. **Do NOT generate BreadcrumbList schema** — breadcrumbs are rendered in application code and do not need JSON-LD markup.

---

## Base Schemas (Constants)

These appear on every page or are referenced by `@id` from other schemas.

### Organization (Global Constant)

This is defined once and referenced everywhere. Include it in the `@graph` of every page, or reference by `@id`.

```json
{
  "@type": "Organization",
  "@id": "https://www.comparaja.pt/#organization",
  "name": "ComparaJá",
  "url": "https://www.comparaja.pt",
  "logo": {
    "@type": "ImageObject",
    "url": "https://a.storyblok.com/f/223704/125x26/bb79b70cf7/cpj_logo.svg",
    "width": 125,
    "height": 26
  },
  "description": "Intermediário de crédito autorizado pelo Banco de Portugal que ajuda a comparar e encontrar as melhores condições de crédito habitação, energia, seguros e outros produtos financeiros.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "PT"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+351-211-165-765",
    "contactType": "customer service",
    "availableLanguage": "Portuguese"
  },
  "sameAs": [
    "https://www.facebook.com/ComparaJa",
    "https://www.instagram.com/comparaja",
    "https://www.linkedin.com/company/compara-ja",
    "https://twitter.com/comparaja",
    "https://www.tiktok.com/@comparaja"
  ]
}
```

### WebSite (Global Constant)

```json
{
  "@type": "WebSite",
  "@id": "https://www.comparaja.pt/#website",
  "name": "ComparaJá.pt",
  "url": "https://www.comparaja.pt/",
  "publisher": {
    "@type": "Organization",
    "@id": "https://www.comparaja.pt/#organization"
  },
  "inLanguage": "pt-PT"
}
```

---

## E-E-A-T Person Schema (YMYL-Critical)

This is the single most important differentiator for ComparaJá's YMYL schema strategy. Every article and comparison page must include detailed Person schemas for the **author**, **contributor** (data validator), and **reviewer** (subject-matter expert).

### Person Schema Template

The following template produces the comprehensive Person schema ComparaJá uses. Populate all fields from the team member's profile data.

```json
{
  "@type": "Person",
  "@id": "https://www.comparaja.pt/sobre-nos/{slug}/#person",
  "name": "{Full Name}",
  "givenName": "{First}",
  "familyName": "{Last}",
  "url": "https://www.comparaja.pt/sobre-nos/{slug}",
  "email": "{name}@comparaja.pt",
  "image": {
    "@type": "ImageObject",
    "url": "https://a.storyblok.com/f/223704/{image-path}/m/94x94/filters:format(webp):quality(80)",
    "width": 94,
    "height": 94
  },
  "jobTitle": "{Job Title}",
  "description": "{2-3 sentence professional bio in Portuguese emphasizing domain expertise, years of experience, and regulatory knowledge.}",
  "worksFor": {
    "@type": "Organization",
    "@id": "https://www.comparaja.pt/#organization"
  },
  "nationality": {
    "@type": "Country",
    "name": "Portugal"
  },
  "alumniOf": [
    {
      "@type": "EducationalOrganization",
      "name": "{Degree/Qualification Name}"
    }
  ],
  "hasCredential": [
    {
      "@type": "EducationalOccupationalCredential",
      "credentialCategory": "{postgraduate|master degree|bachelor degree|certificate}",
      "name": "{Credential Name}"
    }
  ],
  "hasOccupation": {
    "@type": "Occupation",
    "name": "{Job Title}",
    "occupationLocation": {
      "@type": "Country",
      "name": "Portugal"
    },
    "description": "{Role description in Portuguese}",
    "skills": ["{Skill 1}", "{Skill 2}", "{Skill 3}"]
  },
  "knowsAbout": [
    {
      "@type": "Thing",
      "name": "{Topic}",
      "description": "{1-2 sentence description of expertise in Portuguese}"
    }
  ],
  "sameAs": [
    "https://www.linkedin.com/in/{linkedin-slug}/"
  ]
}
```

### Person Roles on Pages

- **`author`** — The content writer. Must include full E-E-A-T details (credentials, knowsAbout, occupation).
- **`contributor`** — The data analyst/validator. Signals that financial data has been verified independently.
- **`reviewedBy`** — The subject-matter expert (e.g., mortgage consultant team leader). Signals expert review of claims.

All three together communicate the full E-E-A-T chain: content creation → data validation → expert review.

### Building `knowsAbout` Arrays

Each `knowsAbout` entry should be specific to the person's domain expertise and relevant to the page vertical. Always use Portuguese descriptions. Structure each entry to explicitly connect the person to their area of authority:

| Role | knowsAbout Focus |
|---|---|
| Content writer | Financial literacy, content strategy, SEO, the specific product vertical |
| Operations analyst | Data analysis, data validation, quality assurance, the specific product vertical |
| Product consultant | The product vertical in depth, regulatory processes, client advisory, comparison methodology |

---

## Page-Type Templates

### Template A: Comparison / Simulator Landing Page

This is the primary page type for ComparaJá (e.g., `/credito-habitacao`, `/seguros-vida`, `/energia`).

Use a `@graph` containing:

1. **Organization** (full or by `@id`)
2. **WebSite** (by `@id` reference)
3. **WebPage** with author, contributor, reviewedBy
4. **Service** describing the comparison/simulation service
5. **Dataset** (if the page contains comparative data tables — e.g., spread tables, rate comparisons, tariff matrices)

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.comparaja.pt/#organization",
      "name": "ComparaJá"
    },
    {
      "@type": "WebPage",
      "@id": "https://www.comparaja.pt/{vertical}/#webpage",
      "name": "{Page Title} | ComparaJá",
      "url": "https://www.comparaja.pt/{vertical}",
      "description": "{Meta description}",
      "image": "https://a.storyblok.com/f/223704/125x26/bb79b70cf7/cpj_logo.svg",
      "inLanguage": "pt-PT",
      "datePublished": "{ISO 8601}",
      "dateModified": "{ISO 8601}",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://www.comparaja.pt/#website"
      },
      "about": {
        "@type": "Thing",
        "name": "{Topic description in Portuguese}"
      },
      "author": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{author-slug}/#person"
      },
      "contributor": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{contributor-slug}/#person"
      },
      "reviewedBy": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{reviewer-slug}/#person"
      }
    },
    {
      "@type": "Service",
      "@id": "https://www.comparaja.pt/{vertical}/#service",
      "name": "Comparação de {Product Name}",
      "url": "https://www.comparaja.pt/{vertical}",
      "description": "{Service description emphasizing free comparison, bank coverage, and personalized guidance}",
      "provider": {
        "@type": "Organization",
        "@id": "https://www.comparaja.pt/#organization"
      },
      "areaServed": {
        "@type": "Country",
        "name": "Portugal"
      },
      "category": "Serviços Financeiros",
      "offers": {
        "@type": "Offer",
        "url": "https://www.comparaja.pt/{vertical}",
        "price": "0",
        "priceCurrency": "EUR",
        "availability": "https://schema.org/InStock",
        "description": "{Free service description}"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "{value}",
        "bestRating": "5",
        "worstRating": "1",
        "reviewCount": "{count}"
      },
      "review": [
        {
          "@type": "Review",
          "author": { "@type": "Person", "name": "{Reviewer Name}" },
          "datePublished": "{YYYY-MM-DD}",
          "reviewBody": "{Review text — must be visible on the page}",
          "reviewRating": {
            "@type": "Rating",
            "ratingValue": "{value}",
            "bestRating": "5",
            "worstRating": "1"
          }
        }
      ]
    }
  ]
}
```

**If the comparison page contains data tables** (e.g., bank spread comparisons, rate tables), add a Dataset node to the `@graph`:

```json
{
  "@type": "Dataset",
  "@id": "https://www.comparaja.pt/{vertical}#{dataset-slug}",
  "name": "{Dataset Title — e.g., Comparação de Spreads de Crédito Habitação 2026}",
  "description": "{What the dataset contains, methodology, and scope}",
  "keywords": ["{keyword1}", "{keyword2}"],
  "spatialCoverage": {
    "@type": "Place",
    "name": "Portugal",
    "address": { "@type": "PostalAddress", "addressCountry": "PT" }
  },
  "datePublished": "{YYYY-MM-DD}",
  "dateModified": "{YYYY-MM-DD}",
  "temporalCoverage": "{YYYY}",
  "isAccessibleForFree": true,
  "license": "https://www.comparaja.pt/termos-condicoes-gerais",
  "creator": { "@type": "Organization", "@id": "https://www.comparaja.pt/#organization" },
  "publisher": { "@type": "Organization", "@id": "https://www.comparaja.pt/#organization" },
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "text/html",
    "contentUrl": "https://www.comparaja.pt/{vertical}"
  },
  "measurementTechnique": "{How the data was collected}",
  "citation": "ComparaJá.pt ({YYYY}). {Dataset Title}. https://www.comparaja.pt/{vertical}",
  "variableMeasured": {
    "@type": "PropertyValue",
    "name": "{What is measured}",
    "unitText": "{Unit}"
  },
  "inLanguage": "pt"
}
```

**Important:** The `aggregateRating` and `review` on the Service schema MUST reflect real, visible reviews on the page. For ComparaJá, these typically come from verified customer testimonials displayed on comparison landing pages.

### Template B: Financial Article / Guide Page

For article pages (e.g., `/credito-habitacao/artigos/spread`, `/seguros/artigos/seguro-vida`).

The `@graph` adds a full `Article` entity. Person schemas should be included in full (not just `@id` references) when this is the canonical page where the author's expertise is most relevant — this maximizes E-E-A-T crawl value.

If the article contains comparative data tables (e.g., spread comparisons, rate tables), also include a **Dataset** node.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://www.comparaja.pt/#organization",
      "name": "ComparaJá"
    },
    {
      "@type": "WebPage",
      "@id": "https://www.comparaja.pt/{path}/#webpage",
      "name": "{Article Title} | ComparaJá",
      "url": "https://www.comparaja.pt/{path}",
      "description": "{Meta description}",
      "inLanguage": "pt-PT",
      "datePublished": "{ISO 8601}",
      "dateModified": "{ISO 8601}",
      "isPartOf": {
        "@type": "WebSite",
        "@id": "https://www.comparaja.pt/#website"
      },
      "author": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{author-slug}/#person"
      },
      "contributor": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{contributor-slug}/#person"
      },
      "reviewedBy": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{reviewer-slug}/#person"
      }
    },
    {
      "@type": "Article",
      "headline": "{Article H1 — max 110 characters}",
      "description": "{Article meta description}",
      "image": "{Article hero image URL}",
      "datePublished": "{ISO 8601}",
      "dateModified": "{ISO 8601}",
      "author": {
        "@type": "Person",
        "@id": "https://www.comparaja.pt/sobre-nos/{author-slug}/#person"
      },
      "publisher": {
        "@type": "Organization",
        "@id": "https://www.comparaja.pt/#organization"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://www.comparaja.pt/{path}/#webpage"
      },
      "inLanguage": "pt-PT"
    },
    {
      "@type": "Person",
      "@id": "https://www.comparaja.pt/sobre-nos/{author-slug}/#person",
      "name": "...",
      "__comment": "FULL Person schema here — see E-E-A-T Person Template above"
    },
    {
      "@type": "Person",
      "@id": "https://www.comparaja.pt/sobre-nos/{contributor-slug}/#person",
      "name": "...",
      "__comment": "FULL Person schema here"
    },
    {
      "@type": "Person",
      "@id": "https://www.comparaja.pt/sobre-nos/{reviewer-slug}/#person",
      "name": "...",
      "__comment": "FULL Person schema here"
    }
  ]
}
```

**When to include full Person schemas vs. `@id` references:** Include the full Person definition on article pages where the author's expertise is directly relevant to the content topic. On comparison landing pages where the focus is the Service, use `@id` references to keep the markup leaner. Google crawls cross-page `@id` references and builds entity graphs from them.

**Adding Dataset to articles:** If the article contains a comparative data table (e.g., a spreads table on `/credito-habitacao/artigos/spread`), add a Dataset node to the `@graph` using the same Dataset template shown in Template A above. Use the article's URL path for the `@id` and `contentUrl`.

### When to Include Dataset Schema

Dataset is not its own page type — it's an **add-on** to comparison landing pages and article pages when they contain comparative financial data visible in tables. Add a Dataset node to the `@graph` whenever the page displays:

- Bank spread comparison tables
- Energy tariff comparison matrices
- Insurance premium comparison tables
- Telecom package comparison data
- Interest rate or TAEG tracking tables
- Any structured numerical data comparing providers/products

**Do NOT use Dataset for:** editorial content tables that are illustrative (e.g., a table explaining what different mortgage types mean), tables of contents, or feature comparison checkboxes without numerical data.

The full Dataset template is shown in Template A above. Use the page's own URL path for `@id`, `contentUrl`, and `citation`.

---

## Speakable Specification

For key landing pages, include `speakable` to indicate which content is most suitable for voice assistants and AI read-aloud:

```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [".hero-title", ".hero-description", ".main-cta"]
}
```

Use CSS selectors that target the page's primary headline, value proposition, and call-to-action. Only include on pages where voice search discovery is a priority (comparison landing pages, not deep articles).

---

## Vertical-Specific Notes

### Crédito Habitação
- Service `category`: `"Serviços Financeiros"`
- Emphasize Banco de Portugal authorization in Organization description
- Dataset: spreads, TAEG comparisons, Euribor tracking
- Reviewer `knowsAbout` should include: Crédito Habitação, Transferência de Crédito, Interpretação de FINE, Comparação de Propostas Bancárias

### Seguros
- Service `category`: `"Seguros"`
- Reference ASF (Autoridade de Supervisão de Seguros e Fundos de Pensões) in descriptions where relevant
- Dataset: premium comparisons, coverage tables
- Reviewer `knowsAbout`: Seguros de Vida, Seguros Multirriscos, Coberturas

### Energia
- Service `category`: `"Serviços de Energia"`
- Dataset: tariff comparisons, provider rates
- Reference ERSE (Entidade Reguladora dos Serviços Energéticos) where relevant

### Telecomunicações
- Service `category`: `"Telecomunicações"`
- Dataset: package comparisons, speed/price matrices
- Reference ANACOM where relevant

### Cartões de Crédito
- Service `category`: `"Serviços Financeiros"`
- Dataset: fee comparisons, benefit tables, TAEG

---

## Generation Workflow

When asked to generate schema for a ComparaJá page:

1. **Identify the page type** from the URL pattern or user description. Map to the Page Types table above.
2. **Determine which templates are needed.** Every page needs Organization (ref) and WebPage. Comparison pages add Service. Articles add Article. Pages with comparative data tables add Dataset.
3. **Collect the data.** If a URL is provided, fetch it and extract: title, description, dates, author info, visible reviews/ratings, data tables. If raw content is provided, parse it.
4. **Identify the people.** Determine who the author, contributor, and reviewer are. Ask the user if not clear. Build full Person schemas with E-E-A-T details.
5. **Assemble the `@graph`.** Combine all schema blocks into a single `@graph` array with proper `@id` linking. Do NOT include BreadcrumbList — it is handled in application code.
6. **Validate.** Check JSON syntax, ISO 8601 dates with PT timezone, absolute URLs, schema.org enumeration URLs, no deprecated types.
7. **Deliver.** Provide the complete `<script type="application/ld+json">` block. Recommend placement in `<head>`. Recommend validation at https://search.google.com/test/rich-results and https://validator.schema.org.

---

## Validation Checklist (ComparaJá-Specific)

Before delivering any schema:

- [ ] Valid JSON syntax (no trailing commas, proper quoting, no `__comment` fields in production)
- [ ] `@context` is `"https://schema.org"`
- [ ] All entities use consistent `@id` patterns per the convention above
- [ ] Organization `@id` is `https://www.comparaja.pt/#organization`
- [ ] Dates use ISO 8601 with Portuguese timezone (`+00:00` or `+01:00`)
- [ ] All URLs are absolute `https://` URLs
- [ ] `inLanguage` is `"pt-PT"` on WebPage and Article, `"pt"` on Dataset
- [ ] `priceCurrency` is `"EUR"` wherever used
- [ ] Enumerations use full schema.org URLs (`https://schema.org/InStock`)
- [ ] `aggregateRating` and `review` on Service reflect actual visible reviews
- [ ] No deprecated types (FAQPage, HowTo, etc.)
- [ ] Person schemas include at minimum: name, jobTitle, worksFor, description, knowsAbout, hasCredential
- [ ] Author/contributor/reviewer roles are all present on article and comparison pages
- [ ] `dateModified` is genuinely updated when content changes
- [ ] Image URLs point to real Storyblok assets or valid CDN paths

## Common Mistakes Specific to ComparaJá

- **Orphaned `@id` references:** Referencing a Person by `@id` but never defining them anywhere in the graph. Either include the full definition or ensure it exists on another crawled page.
- **Stale review data:** Hardcoded `reviewCount` or `ratingValue` that doesn't match the page. These should be dynamically populated.
- **Missing `dateModified` updates:** Financial content changes frequently. A `dateModified` from months ago on a spreads page signals stale data.
- **Overloaded `knowsAbout`:** Including topics the person doesn't actually have expertise in. Each `knowsAbout` entry should be defensible.
- **`alumniOf` confusion:** Use `EducationalOrganization` for institutions, not for professional internships. An internship is work experience, not education — use `hasCredential` with `credentialCategory: "certificate"` instead, or move to the `description` field.
- **Duplicate `@context`:** When using `@graph`, only one `@context` is needed at the root level. Never nest `@context` inside individual graph nodes.
- **Using `FAQPage`:** ComparaJá is not eligible for FAQ rich results post-2025. Don't generate it.

## AI & Future-Proofing

Structured data is increasingly critical for AI-powered search. Google's AI Overviews, Bing Copilot, and other LLM-based engines rely on structured markup to understand, cite, and accurately represent content. For a YMYL financial comparison site like ComparaJá, this means:

- **Dataset schema** improves odds of AI systems citing your data tables as authoritative sources.
- **Detailed Person schemas** with credentials and `knowsAbout` help AI systems attribute claims to qualified experts — essential for financial content.
- **Service schema** with real reviews helps AI systems recommend your comparison tool by name.
- **Entity linking via `@id`** builds a coherent knowledge graph that AI crawlers can traverse to understand relationships between your organization, people, services, and content.

The investment in comprehensive schema today is a direct investment in AI search visibility tomorrow.
