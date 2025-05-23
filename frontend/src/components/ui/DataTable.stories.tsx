import type { Meta, StoryObj } from '@storybook/react';
import { DataTable } from './DataTable';

const meta: Meta<typeof DataTable> = {
  title: 'Components/UI/DataTable',
  component: DataTable,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A powerful, responsive data table with sorting, filtering, and pagination capabilities.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onRowClick: { action: 'row-clicked' },
    onSort: { action: 'sorted' },
    onFilter: { action: 'filtered' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sampleData = [
  {
    id: 1,
    property: 'Luxury Downtown Apartment',
    tenant: 'John Doe',
    rent: '$2,500',
    status: 'Paid',
    dueDate: '2024-02-01',
  },
  {
    id: 2,
    property: 'Family House with Garden',
    tenant: 'Jane Smith',
    rent: '$3,200',
    status: 'Pending',
    dueDate: '2024-02-01',
  },
  {
    id: 3,
    property: 'Modern Studio Loft',
    tenant: 'Mike Johnson',
    rent: '$1,800',
    status: 'Overdue',
    dueDate: '2024-01-15',
  },
  {
    id: 4,
    property: 'Beachfront Condo',
    tenant: 'Sarah Wilson',
    rent: '$4,500',
    status: 'Paid',
    dueDate: '2024-02-01',
  },
  {
    id: 5,
    property: 'City Center Office',
    tenant: 'Tech Corp Inc.',
    rent: '$6,000',
    status: 'Pending',
    dueDate: '2024-02-01',
  },
];

const columns = [
  {
    key: 'property',
    title: 'Property',
    sortable: true,
    width: '25%',
  },
  {
    key: 'tenant',
    title: 'Tenant',
    sortable: true,
    width: '20%',
  },
  {
    key: 'rent',
    title: 'Monthly Rent',
    sortable: true,
    width: '15%',
    align: 'right' as const,
  },
  {
    key: 'dueDate',
    title: 'Due Date',
    sortable: true,
    width: '15%',
  },
  {
    key: 'status',
    title: 'Status',
    sortable: true,
    width: '15%',
    render: (value: string) => {
      const statusColors = {
        Paid: 'bg-green-100 text-green-800',
        Pending: 'bg-yellow-100 text-yellow-800',
        Overdue: 'bg-red-100 text-red-800',
      };
      return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
          {value}
        </span>
      );
    },
  },
  {
    key: 'actions',
    title: 'Actions',
    width: '10%',
    render: () => (
      <div className="flex space-x-2">
        <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
        <button className="text-gray-600 hover:text-gray-800 text-sm">Edit</button>
      </div>
    ),
  },
];

export const Default: Story = {
  args: {
    data: sampleData,
    columns: columns,
    searchable: true,
    paginated: true,
    pageSize: 10,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    loading: true,
  },
};

export const NoData: Story = {
  args: {
    ...Default.args,
    data: [],
  },
};

export const LargeDataset: Story = {
  args: {
    ...Default.args,
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      property: `Property ${i + 1}`,
      tenant: `Tenant ${i + 1}`,
      rent: `$${(Math.random() * 5000 + 1000).toFixed(0)}`,
      status: ['Paid', 'Pending', 'Overdue'][Math.floor(Math.random() * 3)],
      dueDate: '2024-02-01',
    })),
    pageSize: 5,
  },
};

export const Mobile: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};

export const Tablet: Story = {
  args: Default.args,
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const CustomStyling: Story = {
  args: {
    ...Default.args,
    className: 'border-2 border-blue-200 rounded-lg shadow-lg',
    headerClassName: 'bg-blue-50',
    rowClassName: 'hover:bg-blue-25',
  },
};

export const WithoutSearch: Story = {
  args: {
    ...Default.args,
    searchable: false,
  },
};

export const WithoutPagination: Story = {
  args: {
    ...Default.args,
    paginated: false,
  },
};