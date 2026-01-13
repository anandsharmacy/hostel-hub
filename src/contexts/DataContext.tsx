import React, { createContext, useContext, useState, ReactNode } from 'react';

export type RequestStatus = 'pending' | 'in-progress' | 'completed';

export interface CleaningRequest {
  id: string;
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
  studentName: string;
  roomNumber: string;
  hostelBlock: string;
  category: string;
  items: { name: string; quantity: number }[];
  status: RequestStatus;
  createdAt: string;
}

interface DataContextType {
  cleaningRequests: CleaningRequest[];
  applianceComplaints: ApplianceComplaint[];
  storeOrders: StoreOrder[];
  addCleaningRequest: (request: Omit<CleaningRequest, 'id' | 'status' | 'createdAt'>) => void;
  addApplianceComplaint: (complaint: Omit<ApplianceComplaint, 'id' | 'status' | 'createdAt'>) => void;
  addStoreOrder: (order: Omit<StoreOrder, 'id' | 'status' | 'createdAt'>) => void;
  updateCleaningRequestStatus: (id: string, status: RequestStatus) => void;
  updateApplianceComplaintStatus: (id: string, status: RequestStatus) => void;
  updateStoreOrderStatus: (id: string, status: RequestStatus) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock data
const initialCleaningRequests: CleaningRequest[] = [
  {
    id: '1',
    studentName: 'Priya Patel',
    hostelBlock: 'Block B',
    roomNumber: '205',
    preferredDate: '2026-01-14',
    preferredTime: '10:00 AM',
    notes: 'Please clean the bathroom as well',
    status: 'pending',
    createdAt: '2026-01-13T09:00:00',
  },
  {
    id: '2',
    studentName: 'Amit Kumar',
    hostelBlock: 'Block A',
    roomNumber: '112',
    preferredDate: '2026-01-14',
    preferredTime: '02:00 PM',
    notes: '',
    status: 'in-progress',
    createdAt: '2026-01-12T14:30:00',
  },
];

const initialApplianceComplaints: ApplianceComplaint[] = [
  {
    id: '1',
    studentName: 'Sneha Reddy',
    roomNumber: '308',
    hostelBlock: 'Block A',
    appliance: 'AC',
    description: 'AC is not cooling properly, making noise',
    status: 'pending',
    createdAt: '2026-01-13T08:15:00',
  },
  {
    id: '2',
    studentName: 'Vikram Singh',
    roomNumber: '401',
    hostelBlock: 'Block C',
    appliance: 'Geyser',
    description: 'Geyser not heating water',
    status: 'in-progress',
    createdAt: '2026-01-12T16:45:00',
  },
];

const initialStoreOrders: StoreOrder[] = [
  {
    id: '1',
    studentName: 'Neha Gupta',
    roomNumber: '203',
    hostelBlock: 'Block B',
    category: 'Stationery',
    items: [
      { name: 'Notebook', quantity: 3 },
      { name: 'Pen Set', quantity: 2 },
    ],
    status: 'pending',
    createdAt: '2026-01-13T11:00:00',
  },
  {
    id: '2',
    studentName: 'Arjun Mehta',
    roomNumber: '105',
    hostelBlock: 'Block A',
    category: 'Fruits',
    items: [
      { name: 'Apples (1kg)', quantity: 1 },
      { name: 'Bananas (dozen)', quantity: 2 },
    ],
    status: 'completed',
    createdAt: '2026-01-12T10:30:00',
  },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const [cleaningRequests, setCleaningRequests] = useState<CleaningRequest[]>(initialCleaningRequests);
  const [applianceComplaints, setApplianceComplaints] = useState<ApplianceComplaint[]>(initialApplianceComplaints);
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>(initialStoreOrders);

  const addCleaningRequest = (request: Omit<CleaningRequest, 'id' | 'status' | 'createdAt'>) => {
    const newRequest: CleaningRequest = {
      ...request,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setCleaningRequests((prev) => [newRequest, ...prev]);
  };

  const addApplianceComplaint = (complaint: Omit<ApplianceComplaint, 'id' | 'status' | 'createdAt'>) => {
    const newComplaint: ApplianceComplaint = {
      ...complaint,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setApplianceComplaints((prev) => [newComplaint, ...prev]);
  };

  const addStoreOrder = (order: Omit<StoreOrder, 'id' | 'status' | 'createdAt'>) => {
    const newOrder: StoreOrder = {
      ...order,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setStoreOrders((prev) => [newOrder, ...prev]);
  };

  const updateCleaningRequestStatus = (id: string, status: RequestStatus) => {
    setCleaningRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status } : req))
    );
  };

  const updateApplianceComplaintStatus = (id: string, status: RequestStatus) => {
    setApplianceComplaints((prev) =>
      prev.map((complaint) => (complaint.id === id ? { ...complaint, status } : complaint))
    );
  };

  const updateStoreOrderStatus = (id: string, status: RequestStatus) => {
    setStoreOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
  };

  return (
    <DataContext.Provider
      value={{
        cleaningRequests,
        applianceComplaints,
        storeOrders,
        addCleaningRequest,
        addApplianceComplaint,
        addStoreOrder,
        updateCleaningRequestStatus,
        updateApplianceComplaintStatus,
        updateStoreOrderStatus,
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
