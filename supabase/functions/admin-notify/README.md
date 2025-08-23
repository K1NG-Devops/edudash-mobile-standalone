# admin-notify Edge Function

Purpose: Create system/admin notifications bypassing RLS using the Supabase service role key. Intended for backend or admin tools only.

Security
- Requires Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
- Do NOT call this from untrusted clients. Only from secure backend or admin environments.

Request
POST /admin-notify
Content-Type: application/json

Body fields:
- user_id (string, optional) target user id
- title (string, required)
- body (string, required)
- data (object, optional) additional metadata
- preschool_id (string, optional)
- role (string, optional)

Local testing
- Ensure the function has access to SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
- With the Supabase CLI:

supabase functions serve admin-notify --env-file ./supabase/.env

Deployment

supabase functions deploy admin-notify

Example usage

curl -X POST \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  "https://<PROJECT_REF>.functions.supabase.co/admin-notify" \
  -d '{
    "user_id": "00000000-0000-0000-0000-000000000000",
    "title": "System maintenance",
    "body": "We will have a brief maintenance window tonight at 22:00.",
    "data": {"severity": "info"}
  }'

