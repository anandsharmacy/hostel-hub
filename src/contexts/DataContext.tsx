import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

export type RequestStatus = 'pending' | 'in-progress' | 'completed';

export interface CleaningRequest {
  id: string;
  user_id: string;
  studentName: string;
  hostelBlock: string;
  roomNumber: string;
  preferredDate: string;
  preferredTime: string;
  notes: string;
  status: RequestStatus;
  createdAt: string;
}

export interface ApplianceComplaint {
  id: string;
  user_id: string;
  studentName: string;
  roomNumber: string;
  hostelBlock: string;
  appliance: string;
  description: string;
  status: RequestStatus;
  createdAt: string;
}

export interface StoreOrder {
  id: string;
  user_id: string;
  studentName: string;
  roomNumber: string;
  hostelBlock: string;
  category: string;
  items: { name: string; quantity: number }[];
  status: RequestStatus;
  createdAt: string;
  receiptNumber: string | null;
}

export interface MedicineRequest {
  id: string;
  user_id: string;
  studentName: string;
  roomNumber: string;
  hostelBlock: string;
  medicineName: string | null;
  prescriptionUrl: string | null;
  notes: string | null;
  status: RequestStatus;
  createdAt: string;
  receiptNumber: string | null;
}

interface DataContextType {
  cleaningRequests: CleaningRequest[];
  applianceComplaints: ApplianceComplaint[];
  storeOrders: StoreOrder[];
  medicineRequests: MedicineRequest[];
  isLoading: boolean;
  addCleaningRequest: (request: Omit<CleaningRequest, 'id' | 'user_id' | 'status' | 'createdAt'>) => Promise<void>;
  addApplianceComplaint: (complaint: Omit<ApplianceComplaint, 'id' | 'user_id' | 'status' | 'createdAt'>) => Promise<void>;
  addStoreOrder: (order: Omit<StoreOrder, 'id' | 'user_id' | 'status' | 'createdAt' | 'receiptNumber'>) => Promise<void>;
  addMedicineRequest: (request: Omit<MedicineRequest, 'id' | 'user_id' | 'status' | 'createdAt' | 'receiptNumber'>) => Promise<void>;
  updateCleaningRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  updateApplianceComplaintStatus: (id: string, status: RequestStatus) => Promise<void>;
  updateStoreOrderStatus: (id: string, status: RequestStatus) => Promise<void>;
  updateMedicineRequestStatus: (id: string, status: RequestStatus) => Promise<void>;
  refetchData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to map database row to CleaningRequest
function mapCleaningRequest(row: any): CleaningRequest {
  return {
    id: row.id,
    user_id: row.user_id,
    studentName: row.student_name,
    hostelBlock: row.hostel_block,
    roomNumber: row.room_number,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time,
    notes: row.notes || '',
    status: row.status as RequestStatus,
    createdAt: row.created_at,
  };
}

// Helper to map database row to ApplianceComplaint
function mapApplianceComplaint(row: any): ApplianceComplaint {
  return {
    id: row.id,
    user_id: row.user_id,
    studentName: row.student_name,
    hostelBlock: row.hostel_block,
    roomNumber: row.room_number,
    appliance: row.appliance,
    description: row.description,
    status: row.status as RequestStatus,
    createdAt: row.created_at,
  };
}

// Helper to map database row to StoreOrder
function mapStoreOrder(row: any): StoreOrder {
  return {
    id: row.id,
    user_id: row.user_id,
    studentName: row.student_name,
    hostelBlock: row.hostel_block,
    roomNumber: row.room_number,
    category: row.category,
    items: row.items as { name: string; quantity: number }[],
    status: row.status as RequestStatus,
    createdAt: row.created_at,
    receiptNumber: row.receipt_number,
  };
}

// Helper to map database row to MedicineRequest
function mapMedicineRequest(row: any): MedicineRequest {
  return {
    id: row.id,
    user_id: row.user_id,
    studentName: row.student_name,
    hostelBlock: row.hostel_block,
    roomNumber: row.room_number,
    medicineName: row.medicine_name,
    prescriptionUrl: row.prescription_url,
    notes: row.notes,
    status: row.status as RequestStatus,
    createdAt: row.created_at,
    receiptNumber: row.receipt_number,
  };
}

export function DataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [cleaningRequests, setCleaningRequests] = useState<CleaningRequest[]>([]);
  const [applianceComplaints, setApplianceComplaints] = useState<ApplianceComplaint[]>([]);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>([]);
  const [medicineRequests, setMedicineRequests] = useState<MedicineRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCleaningRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('cleaning_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching cleaning requests:', error);
      return [];
    }
    return (data || []).map(mapCleaningRequest);
  }, []);

  const fetchApplianceComplaints = useCallback(async () => {
    const { data, error } = await supabase
      .from('appliance_complaints')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching appliance complaints:', error);
      return [];
    }
    return (data || []).map(mapApplianceComplaint);
  }, []);

  const fetchStoreOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('store_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching store orders:', error);
      return [];
    }
    return (data || []).map(mapStoreOrder);
  }, []);

  const fetchMedicineRequests = useCallback(async () => {
    const { data, error } = await supabase
      .from('medicine_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching medicine requests:', error);
      return [];
    }
    return (data || []).map(mapMedicineRequest);
  }, []);

  const refetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const [cleaning, appliance, orders, medicine] = await Promise.all([
        fetchCleaningRequests(),
        fetchApplianceComplaints(),
        fetchStoreOrders(),
        fetchMedicineRequests(),
      ]);
      setCleaningRequests(cleaning);
      setApplianceComplaints(appliance);
      setStoreOrders(orders);
      setMedicineRequests(medicine);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchCleaningRequests, fetchApplianceComplaints, fetchStoreOrders, fetchMedicineRequests]);

  useEffect(() => {
    if (isAuthenticated) {
      refetchData();
    } else {
      // Clear data when logged out
      setCleaningRequests([]);
      setApplianceComplaints([]);
      setStoreOrders([]);
      setMedicineRequests([]);
    }
  }, [isAuthenticated, refetchData]);

  const addCleaningRequest = async (request: Omit<CleaningRequest, 'id' | 'user_id' | 'status' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('cleaning_requests').insert({
      user_id: user.id,
      student_name: request.studentName,
      hostel_block: request.hostelBlock,
      room_number: request.roomNumber,
      preferred_date: request.preferredDate,
      preferred_time: request.preferredTime,
      notes: request.notes,
      status: 'pending',
    });

    if (error) throw error;
    await refetchData();
  };

  const addApplianceComplaint = async (complaint: Omit<ApplianceComplaint, 'id' | 'user_id' | 'status' | 'createdAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('appliance_complaints').insert({
      user_id: user.id,
      student_name: complaint.studentName,
      hostel_block: complaint.hostelBlock,
      room_number: complaint.roomNumber,
      appliance: complaint.appliance,
      description: complaint.description,
      status: 'pending',
    });

    if (error) throw error;
    await refetchData();
  };

  const addStoreOrder = async (order: Omit<StoreOrder, 'id' | 'user_id' | 'status' | 'createdAt' | 'receiptNumber'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('store_orders').insert({
      user_id: user.id,
      student_name: order.studentName,
      hostel_block: order.hostelBlock,
      room_number: order.roomNumber,
      category: order.category,
      items: order.items,
      status: 'pending',
    });

    if (error) throw error;
    await refetchData();
  };

  const addMedicineRequest = async (request: Omit<MedicineRequest, 'id' | 'user_id' | 'status' | 'createdAt' | 'receiptNumber'>) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.from('medicine_requests').insert({
      user_id: user.id,
      student_name: request.studentName,
      hostel_block: request.hostelBlock,
      room_number: request.roomNumber,
      medicine_name: request.medicineName,
      prescription_url: request.prescriptionUrl,
      notes: request.notes,
      status: 'pending',
    });

    if (error) throw error;
    await refetchData();
  };

  const updateCleaningRequestStatus = async (id: string, status: RequestStatus) => {
    const { error } = await supabase
      .from('cleaning_requests')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await refetchData();
  };

  const updateApplianceComplaintStatus = async (id: string, status: RequestStatus) => {
    const { error } = await supabase
      .from('appliance_complaints')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await refetchData();
  };

  const updateStoreOrderStatus = async (id: string, status: RequestStatus) => {
    const { error } = await supabase
      .from('store_orders')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await refetchData();
  };

  const updateMedicineRequestStatus = async (id: string, status: RequestStatus) => {
    const { error } = await supabase
      .from('medicine_requests')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
    await refetchData();
  };

  return (
    <DataContext.Provider
      value={{
        cleaningRequests,
        applianceComplaints,
        storeOrders,
        medicineRequests,
        isLoading,
        addCleaningRequest,
        addApplianceComplaint,
        addStoreOrder,
        addMedicineRequest,
        updateCleaningRequestStatus,
        updateApplianceComplaintStatus,
        updateStoreOrderStatus,
        updateMedicineRequestStatus,
        refetchData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
