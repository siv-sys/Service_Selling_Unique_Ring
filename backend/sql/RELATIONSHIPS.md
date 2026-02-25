# Database Map (from frontend pages)

- users + user_roles: Register/Login, member vs admin mode
- relationship_pairs + pair_members + pair_invitations: Couple profile search/invite, relationship certificate, pair status
- ring_models + ring_batches + rings + ring_pair_links: Shop, inventory, assigned ring tracking
- memories: Shared memories with original caption + AI caption
- ring_scans: Ring scan page and login ring/biometric style audit trail
- security_logs: Security Logs page
- proximity_preferences: My Ring settings (alerts, threshold, visibility, emergency contact)
- platform_settings + security_policies: Settings page values

Core relationships:

- users 1..* user_roles *..1 roles
- users 1..* pair_members *..1 relationship_pairs
- relationship_pairs 1..* pair_invitations
- relationship_pairs 1..* ring_pair_links *..1 rings
- relationship_pairs 1..* memories
- relationship_pairs 1..* ring_scans
- relationship_pairs 1..* security_logs
- relationship_pairs 1..1 proximity_preferences
