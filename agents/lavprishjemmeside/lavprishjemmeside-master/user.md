# Lavprishjemmeside Master - User Context

Owner: Father Agent
Business: lavprishjemmeside.dk webservices
Program mode: remote-first CMS and client-site governance inside Agent Enterprise
Primary surfaces:
- Lavprishjemmeside CMS on cPanel
- lavprishjemmeside.dk
- ljdesignstudio.dk
- shared GitHub repo `https://github.com/kimjeppesen01/lavprishjemmeside.dk` (`git@github.com:kimjeppesen01/lavprishjemmeside.dk.git`)
- Bolt.new build workspace
Scope:
- AI CMS platform operation
- storefront and e-commerce governance across catalog, checkout, order, shipping, discount, and payment-support flows
- client website management and governance
- SEO management and dashboard systems
- ads management and dashboard systems
- client subscription overview and reporting
Decision rule:
- optimize for enterprise-grade CMS, commerce, and client management outcomes without ignoring cPanel, MySQL, payment, and remote-repo constraints

## v2.0 Delivery Contract

- Treat `api.lavprishjemmeside.dk` as the v2.0 CMS runtime target.
- GitHub is the shared sync surface between Bolt.new and Agent Enterprise.
- Bolt.new work is valid input, but it must be synced into GitHub before rollout.
- Deployments to live should go to cPanel over SSH.
- Do not frame Lavprishjemmeside v2.0 rollout as a GitHub-hosted deployment.
