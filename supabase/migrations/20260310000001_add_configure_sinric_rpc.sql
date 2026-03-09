-- Seed: Configure Sinric device IDs for the demo room
-- This migration sets the actual Sinric Pro device IDs for whatever
-- hostel_block + room_number is used during the demo.
-- It runs AFTER provision_room_controls() has created the skeleton rows.
-- For additional rooms, duplicate this pattern with the correct device IDs.

-- Helper function to assign Sinric device IDs by slug for a given room.
CREATE OR REPLACE FUNCTION public.configure_room_sinric_devices(
  p_hostel_block text,
  p_room_number text,
  p_devices jsonb  -- array of { "slug": "...", "sinric_device_id": "..." }
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
BEGIN
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_devices)
  LOOP
    UPDATE public.room_devices
       SET sinric_device_id = v_item ->> 'sinric_device_id'
     WHERE hostel_block = p_hostel_block
       AND room_number  = p_room_number
       AND slug         = v_item ->> 'slug';
  END LOOP;
END;
$$;
