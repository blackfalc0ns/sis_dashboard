import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DataTable from '../DataTable';

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true, searchable: true },
  { key: 'email', label: 'Email', sortable: false },
];

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
];

describe('DataTable Component', () => {
  it('renders table with data', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('renders column headers', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('NAME')).toBeInTheDocument();
    expect(screen.getByText('EMAIL')).toBeInTheDocument();
  });

  it('shows no data message when data is empty', () => {
    render(<DataTable columns={mockColumns} data={[]} />);
    
    expect(screen.getByText('no_data_available')).toBeInTheDocument();
  });

  it('handles row click', () => {
    const handleRowClick = vi.fn();
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        onRowClick={handleRowClick}
      />
    );
    
    fireEvent.click(screen.getByText('John Doe'));
    expect(handleRowClick).toHaveBeenCalledWith(mockData[0]);
  });

  it('sorts data when column header is clicked', () => {
    render(<DataTable columns={mockColumns} data={mockData} />);
    
    const nameHeader = screen.getByText('NAME');
    fireEvent.click(nameHeader);
    
    // After sorting, Bob should be first (alphabetically)
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Bob Johnson');
  });

  it('highlights search text when searchQuery is provided', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        searchQuery="John"
      />
    );
    
    // Should highlight "John" in "John Doe"
    const marks = screen.getAllByText('John');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('handles special regex characters in search', () => {
    const dataWithSpecialChars = [
      { id: '1', name: 'Test (123)', email: 'test@example.com' },
    ];
    
    // Should not crash with special regex characters
    expect(() => {
      render(
        <DataTable
          columns={mockColumns}
          data={dataWithSpecialChars}
          searchQuery="(123)"
        />
      );
    }).not.toThrow();
  });

  it('paginates data correctly', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    
    render(
      <DataTable
        columns={mockColumns}
        data={largeData}
        itemsPerPage={10}
      />
    );
    
    // Should show first 10 items
    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 10')).toBeInTheDocument();
    expect(screen.queryByText('User 11')).not.toBeInTheDocument();
  });

  it('changes page when pagination button is clicked', () => {
    const largeData = Array.from({ length: 25 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
    }));
    
    render(
      <DataTable
        columns={mockColumns}
        data={largeData}
        itemsPerPage={10}
      />
    );
    
    // Click next page button
    const nextButton = screen.getByTitle('next_page');
    fireEvent.click(nextButton);
    
    // Should show items 11-20
    expect(screen.getByText('User 11')).toBeInTheDocument();
    expect(screen.queryByText('User 1')).not.toBeInTheDocument();
  });
});
