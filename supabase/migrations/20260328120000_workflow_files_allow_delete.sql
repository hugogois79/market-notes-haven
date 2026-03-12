-- Allow users with 'work' permission OR company members to delete workflow files (e.g. when archiving / Mark as Paid)
-- Without this policy, DELETE is denied by RLS and the document reappears after refetch ("sai mas volta a entrar")
CREATE POLICY "Users can delete workflow files" ON workflow_files
  FOR DELETE USING (
    auth.uid() = user_id
    OR user_has_work_permission(auth.uid())
    OR EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = workflow_files.company_id
      AND cu.user_id = auth.uid()
    )
  );
