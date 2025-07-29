import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EquipmentPage } from '../equipment-page';
import { EquipmentForm } from '../equipment-form';
import { EquipmentDetail } from '../equipment-detail';
import { useEquipmentStore } from '@/lib/stores/equipment-store';

// Mock the equipment store
jest.mock('@/lib/stores/equipment-store');

const mockEquipmentStore = {
  equipmentList: [
    {
      id: 'eq-1',
      name: 'Test Camera',
      type: 'camera',
      brand: 'ZWO',
      model: 'ASI2600MC Pro',
      status: 'connected',
      connectionType: 'usb',
      capabilities: ['Cooling', 'High Resolution'],
      settings: { gain: 100, offset: 10 },
      lastConnected: new Date('2024-01-15T10:30:00Z'),
      firmware: 'v1.2.3',
      serialNumber: 'ASI2600MC-12345',
      userId: 'user-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-15T10:30:00Z'),
    },
    {
      id: 'eq-2',
      name: 'Test Mount',
      type: 'mount',
      brand: 'Sky-Watcher',
      model: 'EQ6-R Pro',
      status: 'disconnected',
      connectionType: 'wifi',
      capabilities: ['GoTo', 'Tracking'],
      settings: { trackingRate: 'sidereal' },
      lastConnected: new Date('2024-01-14T20:15:00Z'),
      firmware: 'v4.39.02',
      serialNumber: 'EQ6R-67890',
      userId: 'user-1',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-14T20:15:00Z'),
    },
  ],
  isLoadingEquipment: false,
  equipmentError: null,
  searchQuery: '',
  filterType: null,
  filterStatus: null,
  filterBrand: null,
  sortBy: 'name',
  sortOrder: 'asc',
  isConnectingEquipment: {},
  isDeletingEquipment: {},
  equipmentConnectionErrors: {},
  isAddingEquipment: false,
  isEditingEquipment: false,
  editingEquipmentId: null,
  formErrors: {},
  loadEquipmentList: jest.fn(),
  setSearchQuery: jest.fn(),
  setFilterType: jest.fn(),
  setFilterStatus: jest.fn(),
  setFilterBrand: jest.fn(),
  setSortBy: jest.fn(),
  setSortOrder: jest.fn(),
  clearFilters: jest.fn(),
  connectEquipment: jest.fn(),
  disconnectEquipment: jest.fn(),
  deleteEquipment: jest.fn(),
  testEquipmentConnection: jest.fn(),
  addEquipment: jest.fn(),
  updateEquipment: jest.fn(),
  getFilteredEquipment: jest.fn(() => mockEquipmentStore.equipmentList),
  startAddingEquipment: jest.fn(),
  startEditingEquipment: jest.fn(),
  cancelEquipmentForm: jest.fn(),
  setFormError: jest.fn(),
  clearFormErrors: jest.fn(),
};

describe('Equipment Management Integration', () => {
  beforeEach(() => {
    (useEquipmentStore as jest.Mock).mockReturnValue(mockEquipmentStore);
    jest.clearAllMocks();
  });

  describe('EquipmentPage', () => {
    it('renders equipment list correctly', () => {
      render(<EquipmentPage />);
      
      expect(screen.getByText('Equipment Management')).toBeInTheDocument();
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.getByText('Test Mount')).toBeInTheDocument();
      expect(screen.getByText('ZWO ASI2600MC Pro')).toBeInTheDocument();
      expect(screen.getByText('Sky-Watcher EQ6-R Pro')).toBeInTheDocument();
    });

    it('displays equipment statistics correctly', () => {
      render(<EquipmentPage />);
      
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Equipment
      expect(screen.getByText('1')).toBeInTheDocument(); // Connected
      expect(screen.getByText('1')).toBeInTheDocument(); // Disconnected
      expect(screen.getByText('0')).toBeInTheDocument(); // Errors
    });

    it('handles search functionality', async () => {
      const user = userEvent.setup();
      render(<EquipmentPage />);
      
      const searchInput = screen.getByPlaceholderText(/search equipment/i);
      await user.type(searchInput, 'camera');
      
      expect(mockEquipmentStore.setSearchQuery).toHaveBeenCalledWith('camera');
    });

    it('handles filter functionality', async () => {
      const user = userEvent.setup();
      render(<EquipmentPage />);
      
      // Open filters
      const filtersButton = screen.getByText('Filters');
      await user.click(filtersButton);
      
      // Should show filter controls
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Brand')).toBeInTheDocument();
    });

    it('handles equipment connection', async () => {
      const user = userEvent.setup();
      render(<EquipmentPage />);
      
      // Find the disconnect button for the connected camera
      const disconnectButtons = screen.getAllByText('Disconnect');
      await user.click(disconnectButtons[0]);
      
      expect(mockEquipmentStore.disconnectEquipment).toHaveBeenCalledWith('eq-1');
    });

    it('handles equipment deletion', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      window.confirm = jest.fn(() => true);
      
      render(<EquipmentPage />);
      
      // Find delete buttons
      const deleteButtons = screen.getAllByRole('button');
      const deleteButton = deleteButtons.find(button => 
        button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash-2')
      );
      
      if (deleteButton) {
        await user.click(deleteButton);
        expect(mockEquipmentStore.deleteEquipment).toHaveBeenCalled();
      }
    });

    it('calls onAddEquipment when add button is clicked', async () => {
      const user = userEvent.setup();
      const onAddEquipment = jest.fn();
      
      render(<EquipmentPage onAddEquipment={onAddEquipment} />);
      
      const addButton = screen.getByText('Add Equipment');
      await user.click(addButton);
      
      expect(onAddEquipment).toHaveBeenCalled();
      expect(mockEquipmentStore.startAddingEquipment).toHaveBeenCalled();
    });
  });

  describe('EquipmentForm', () => {
    it('renders add form correctly', () => {
      render(<EquipmentForm onClose={jest.fn()} />);
      
      expect(screen.getByText('Add New Equipment')).toBeInTheDocument();
      expect(screen.getByLabelText(/equipment name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/equipment type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/brand/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('renders edit form correctly', () => {
      const equipment = mockEquipmentStore.equipmentList[0];
      render(<EquipmentForm equipment={equipment} onClose={jest.fn()} />);
      
      expect(screen.getByText('Edit Equipment')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Camera')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ZWO')).toBeInTheDocument();
      expect(screen.getByDisplayValue('ASI2600MC Pro')).toBeInTheDocument();
    });

    it('handles form submission for new equipment', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<EquipmentForm onClose={onClose} />);
      
      // Fill out the form
      await user.type(screen.getByLabelText(/equipment name/i), 'New Camera');
      await user.type(screen.getByLabelText(/brand/i), 'Canon');
      await user.type(screen.getByLabelText(/model/i), 'EOS R5');
      
      // Submit the form
      const submitButton = screen.getByText('Add Equipment');
      await user.click(submitButton);
      
      expect(mockEquipmentStore.addEquipment).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Camera',
          brand: 'Canon',
          model: 'EOS R5',
        })
      );
    });

    it('validates required fields', async () => {
      const user = userEvent.setup();
      render(<EquipmentForm onClose={jest.fn()} />);
      
      // Try to submit without filling required fields
      const submitButton = screen.getByText('Add Equipment');
      await user.click(submitButton);
      
      expect(mockEquipmentStore.setFormError).toHaveBeenCalledWith('name', 'Equipment name is required');
      expect(mockEquipmentStore.setFormError).toHaveBeenCalledWith('brand', 'Brand is required');
      expect(mockEquipmentStore.setFormError).toHaveBeenCalledWith('model', 'Model is required');
    });

    it('handles capabilities management', async () => {
      const user = userEvent.setup();
      render(<EquipmentForm onClose={jest.fn()} />);
      
      // Add a capability
      const capabilityInput = screen.getByPlaceholderText(/e.g., Cooling, Auto-focus/i);
      await user.type(capabilityInput, 'Test Capability');
      
      const addCapabilityButton = capabilityInput.nextElementSibling;
      if (addCapabilityButton) {
        await user.click(addCapabilityButton);
      }
      
      // Should show the capability as a badge
      expect(screen.getByText('Test Capability')).toBeInTheDocument();
    });

    it('handles settings management', async () => {
      const user = userEvent.setup();
      render(<EquipmentForm onClose={jest.fn()} />);
      
      // Add a setting
      const settingKeyInput = screen.getByPlaceholderText('Setting name');
      const settingValueInput = screen.getByPlaceholderText('Setting value');
      
      await user.type(settingKeyInput, 'testSetting');
      await user.type(settingValueInput, 'testValue');
      
      const addSettingButton = settingValueInput.nextElementSibling;
      if (addSettingButton) {
        await user.click(addSettingButton);
      }
      
      // Should show the setting
      expect(screen.getByText('testSetting:')).toBeInTheDocument();
      expect(screen.getByText('testValue')).toBeInTheDocument();
    });
  });

  describe('EquipmentDetail', () => {
    it('renders equipment details correctly', () => {
      render(
        <EquipmentDetail 
          equipmentId="eq-1" 
          onBack={jest.fn()} 
          onEdit={jest.fn()} 
        />
      );
      
      expect(screen.getByText('Test Camera')).toBeInTheDocument();
      expect(screen.getByText('ZWO ASI2600MC Pro')).toBeInTheDocument();
      expect(screen.getByText('Connected')).toBeInTheDocument();
    });

    it('handles equipment actions', async () => {
      const user = userEvent.setup();
      const onEdit = jest.fn();
      
      render(
        <EquipmentDetail 
          equipmentId="eq-1" 
          onBack={jest.fn()} 
          onEdit={onEdit} 
        />
      );
      
      // Test edit button
      const editButton = screen.getByText('Edit');
      await user.click(editButton);
      
      expect(onEdit).toHaveBeenCalledWith(mockEquipmentStore.equipmentList[0]);
    });

    it('displays equipment information in tabs', async () => {
      const user = userEvent.setup();
      render(
        <EquipmentDetail 
          equipmentId="eq-1" 
          onBack={jest.fn()} 
          onEdit={jest.fn()} 
        />
      );
      
      // Check overview tab
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Camera')).toBeInTheDocument();
      expect(screen.getByText('ZWO')).toBeInTheDocument();
      
      // Switch to capabilities tab
      const capabilitiesTab = screen.getByText('Capabilities');
      await user.click(capabilitiesTab);
      
      expect(screen.getByText('Cooling')).toBeInTheDocument();
      expect(screen.getByText('High Resolution')).toBeInTheDocument();
    });
  });
});
