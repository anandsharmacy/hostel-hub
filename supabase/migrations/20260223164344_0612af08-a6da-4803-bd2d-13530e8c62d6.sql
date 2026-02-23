ALTER TABLE public.cleaning_requests
ADD COLUMN availability_start text,
ADD COLUMN availability_end text,
ADD COLUMN expected_arrival_start text,
ADD COLUMN expected_arrival_end text;