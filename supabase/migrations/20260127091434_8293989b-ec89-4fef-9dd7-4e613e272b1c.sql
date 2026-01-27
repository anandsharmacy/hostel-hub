-- Add receipt_number column to store_orders table
ALTER TABLE public.store_orders 
ADD COLUMN receipt_number TEXT UNIQUE;

-- Create a function to generate unique receipt numbers
CREATE OR REPLACE FUNCTION public.generate_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  new_receipt_number TEXT;
BEGIN
  -- Format: RCP-YYYYMMDD-XXXX (e.g., RCP-20260127-0001)
  new_receipt_number := 'RCP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
    LPAD(
      (SELECT COALESCE(
        (SELECT COUNT(*) + 1 FROM public.store_orders 
         WHERE DATE(created_at) = DATE(NOW())), 
        1
      )::TEXT), 
      4, '0'
    );
  
  NEW.receipt_number := new_receipt_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate receipt number on insert
DROP TRIGGER IF EXISTS generate_receipt_number_trigger ON public.store_orders;
CREATE TRIGGER generate_receipt_number_trigger
BEFORE INSERT ON public.store_orders
FOR EACH ROW
EXECUTE FUNCTION public.generate_receipt_number();