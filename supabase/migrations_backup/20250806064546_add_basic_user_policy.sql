-- Add ONE simple policy at a time to test for recursion
-- Start with the most basic policy: users can view their own data

-- Policy 1: Users can view their own data using auth.uid() directly
CREATE POLICY "users_can_view_own_data" ON public.users
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

SELECT 'Added basic SELECT policy for own data' as status;
