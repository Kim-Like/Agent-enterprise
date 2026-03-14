# LJ Design Studio Assistant - Architecture

This agent is a generated Lavprishjemmeside client-support packet.

Topology:
- parent orchestrator: lavprishjemmeside-master
- dedicated client domain: ljdesignstudio.dk
- delivery lane: Lavprishjemmeside CMS and e-commerce assistant module
- engineering escalation path: Agent Enterprise Accepted stage -> Engineer

Supported domain scope:
- CMS pages, components, media, design settings, and content operations
- shop catalog, product variants, cart, checkout, discount, shipping, order, and Flatpay / Frisbii payment support

Security contract:
- no cross-agent routing from the client chat
- no arbitrary skill injection from the client surface
- no model or session-type overrides from the client surface
- all runtime access is bound to one site token and one generated client agent
