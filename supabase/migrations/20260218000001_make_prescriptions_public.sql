-- Make prescriptions bucket public to support getPublicUrl usage in frontend
UPDATE storage.buckets
SET public = true
WHERE id = 'prescriptions';
