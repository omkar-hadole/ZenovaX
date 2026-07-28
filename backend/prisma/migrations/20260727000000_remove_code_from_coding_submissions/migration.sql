-- Drop the code column from coding_submissions — source code is no longer
-- stored persistently. It is only needed during execution and discarded
-- immediately after.
ALTER TABLE coding_submissions DROP COLUMN code;