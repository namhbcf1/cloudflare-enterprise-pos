// frontend/src/components/ui/DataTable/DataTable.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Table,
  Input,
  Button,
  Space,
  Dropdown,
  Tooltip,
  Tag,
  Typography,
  Row,
  Col,
  Card,
  Select,
  DatePicker,
  Modal,
  message,
  Checkbox,
  Popover,
  Divider
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExportOutlined,
  ImportOutlined,
  PrinterOutlined,
  ColumnWidthOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import './DataTable.css';

const { Text } = Typography;
const { RangePicker } = DatePicker;

const DataTable = ({
  // Data props
  data = [],
  loading = false,
  columns = [],
  
  // Table configuration
  title,
  showHeader = true,
  pagination = { pageSize: 10, showSizeChanger: true },
  size = 'middle',
  scroll,
  
  // Features
  searchable = true,
  filterable = true,
  exportable = true,
  selectable = false,
  sortable = true,
  resizable = true,
  
  // Actions
  actions = [],
  bulkActions = [],
  onRowClick,
  onSelectionChange,
  onRefresh,
  
  // Customization
  rowKey = 'id',
  className = '',
  style = {},
  
  // Advanced features
  virtualScroll = false,
  expandable,
  summary,
  
  // Data source
  dataSource,
  onChange,
  
  // Toolbar
  showToolbar = true,
  toolbarExtra,
  
  // Export options
  exportFileName = 'data-export',
  exportFormats = ['xlsx', 'csv', 'pdf'],
  
  // Column controls
  columnControls = true,
  defaultHiddenColumns = [],
  
  // Filter options
  customFilters = [],
  quickFilters = [],
  
  // Styling
  tableProps = {},
  
  ...restProps
}) => {
  // States
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const initialVisible = {};
    columns.forEach(col => {
      initialVisible[col.key || col.dataIndex] = !defaultHiddenColumns.includes(col.key || col.dataIndex);
    });
    return initialVisible;
  });
  const [tableSize, setTableSize] = useState(size);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [columnWidths, setColumnWidths] = useState({});
  
  const searchInputRef = useRef(null);

  // Computed columns with search and filters
  const enhancedColumns = useMemo(() => {
    return columns
      .filter(col => visibleColumns[col.key || col.dataIndex])
      .map(column => {
        const enhanced = { ...column };
        
        // Add search functionality
        if (searchable && column.searchable !== false) {
          enhanced.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }}>
              <Input
                ref={searchInputRef}
                placeholder={`Tìm ${column.title}`}
                value={selectedKeys[0]}
                onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                onPressEnter={() => confirm()}
                style={{ width: 188, marginBottom: 8, display: 'block' }}
              />
              <Space>
                <Button
                  type="primary"
                  onClick={() => confirm()}
                  icon={<SearchOutlined />}
                  size="small"
                  style={{ width: 90 }}
                >
                  Tìm
                </Button>
                <Button onClick={() => clearFilters()} size="small" style={{ width: 90 }}>
                  Reset
                </Button>
              </Space>
            </div>
          );
          
          enhanced.filterIcon = filtered => (
            <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
          );
          
          enhanced.onFilter = (value, record) => {
            const cellValue = record[column.dataIndex];
            return cellValue ? cellValue.toString().toLowerCase().includes(value.toLowerCase()) : false;
          };
        }
        
        // Add sorting
        if (sortable && column.sortable !== false) {
          enhanced.sorter = column.sorter || ((a, b) => {
            const aValue = a[column.dataIndex];
            const bValue = b[column.dataIndex];
            
            if (typeof aValue === 'number' && typeof bValue === 'number') {
              return aValue - bValue;
            }
            
            return String(aValue).localeCompare(String(bValue));
          });
        }
        
        // Add column width control
        if (resizable) {
          enhanced.width = columnWidths[column.key || column.dataIndex] || column.width;
        }
        
        return enhanced;
      });
  }, [columns, visibleColumns, searchable, sortable, resizable, columnWidths]);

  // Add actions column if needed
  const finalColumns = useMemo(() => {
    const cols = [...enhancedColumns];
    
    if (actions.length > 0) {
      cols.push({
        title: 'Thao tác',
        key: 'actions',
        fixed: 'right',
        width: actions.length > 2 ? 120 : 80,
        render: (_, record) => (
          <Space size="small">
            {actions.slice(0, 2).map((action, index) => (
              <Tooltip key={index} title={action.title}>
                <Button
                  type={action.type || 'text'}
                  icon={action.icon}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(record);
                  }}
                  disabled={action.disabled && action.disabled(record)}
                />
              </Tooltip>
            ))}
            
            {actions.length > 2 && (
              <Dropdown
                menu={{
                  items: actions.slice(2).map((action, index) => ({
                    key: index + 2,
                    label: action.title,
                    icon: action.icon,
                    disabled: action.disabled && action.disabled(record),
                    onClick: () => action.onClick(record)
                  }))
                }}
                trigger={['click']}
              >
                <Button type="text" icon={<MoreOutlined />} size="small" />
              </Dropdown>
            )}
          </Space>
        )
      });
    }
    
    return cols;
  }, [enhancedColumns, actions]);

  // Global search effect
  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
      return;
    }
    
    const filtered = data.filter(record => {
      return Object.values(record).some(value => 
        value && value.toString().toLowerCase().includes(searchText.toLowerCase())
      );
    });
    
    setFilteredData(filtered);
  }, [data, searchText]);

  // Selection configuration
  const rowSelection = selectable ? {
    selectedRowKeys,
    onChange: (keys, rows) => {
      setSelectedRowKeys(keys);
      onSelectionChange && onSelectionChange(keys, rows);
    },
    getCheckboxProps: (record) => ({
      disabled: record.disabled,
      name: record.name,
    }),
  } : null;

  // Export functions
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${exportFileName}.xlsx`);
    message.success('Xuất Excel thành công!');
  };

  const exportToCSV = () => {
    const csv = [
      columns.map(col => col.title).join(','),
      ...filteredData.map(row => 
        columns.map(col => row[col.dataIndex] || '').join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${exportFileName}.csv`;
    link.click();
    message.success('Xuất CSV thành công!');
  };

  const exportToPDF = () => {
    message.info('Tính năng xuất PDF đang được phát triển...');
  };

  // Column visibility control
  const ColumnControl = () => (
    <div style={{ padding: 16, width: 300 }}>
      <Text strong>Hiển thị cột</Text>
      <Divider style={{ margin: '8px 0' }} />
      {columns.map(col => (
        <div key={col.key || col.dataIndex} style={{ marginBottom: 8 }}>
          <Checkbox
            checked={visibleColumns[col.key || col.dataIndex]}
            onChange={e => setVisibleColumns(prev => ({
              ...prev,
              [col.key || col.dataIndex]: e.target.checked
            }))}
          >
            {col.title}
          </Checkbox>
        </div>
      ))}
    </div>
  );

  // Toolbar component
  const Toolbar = () => (
    <Card size="small" className="datatable-toolbar" style={{ marginBottom: 16 }}>
      <Row justify="space-between" align="middle">
        <Col>
          <Space>
            {title && <Text strong style={{ fontSize: 16 }}>{title}</Text>}
            {filterable && (
              <Button icon={<FilterOutlined />} size="small">
                Bộ lọc
              </Button>
            )}
          </Space>
        </Col>
        
        <Col>
          <Space>
            {/* Global search */}
            {searchable && (
              <Input
                placeholder="Tìm kiếm toàn bộ..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                style={{ width: 200 }}
                allowClear
              />
            )}
            
            {/* Bulk actions */}
            {bulkActions.length > 0 && selectedRowKeys.length > 0 && (
              <Dropdown
                menu={{
                  items: bulkActions.map((action, index) => ({
                    key: index,
                    label: action.title,
                    icon: action.icon,
                    onClick: () => action.onClick(selectedRowKeys)
                  }))
                }}
              >
                <Button>
                  Thao tác hàng loạt ({selectedRowKeys.length})
                </Button>
              </Dropdown>
            )}
            
            {/* Export options */}
            {exportable && (
              <Dropdown
                menu={{
                  items: [
                    { key: 'excel', label: 'Excel (.xlsx)', icon: <ExportOutlined />, onClick: exportToExcel },
                    { key: 'csv', label: 'CSV (.csv)', icon: <ExportOutlined />, onClick: exportToCSV },
                    { key: 'pdf', label: 'PDF (.pdf)', icon: <PrinterOutlined />, onClick: exportToPDF }
                  ]
                }}
              >
                <Button icon={<DownloadOutlined />}>
                  Xuất dữ liệu
                </Button>
              </Dropdown>
            )}
            
            {/* Column controls */}
            {columnControls && (
              <Popover
                content={<ColumnControl />}
                title="Tùy chỉnh cột"
                trigger="click"
              >
                <Button icon={<ColumnWidthOutlined />} />
              </Popover>
            )}
            
            {/* Table size */}
            <Select
              value={tableSize}
              onChange={setTableSize}
              style={{ width: 100 }}
              size="small"
            >
              <Select.Option value="small">Nhỏ</Select.Option>
              <Select.Option value="middle">Vừa</Select.Option>
              <Select.Option value="large">Lớn</Select.Option>
            </Select>
            
            {/* Refresh */}
            {onRefresh && (
              <Button 
                icon={<ReloadOutlined />} 
                onClick={onRefresh}
                loading={loading}
              >
                Làm mới
              </Button>
            )}
            
            {/* Extra toolbar items */}
            {toolbarExtra}
          </Space>
        </Col>
      </Row>
    </Card>
  );

  return (
    <div className={`advanced-datatable ${className}`} style={style}>
      {showToolbar && <Toolbar />}
      
      <Table
        {...tableProps}
        {...restProps}
        columns={finalColumns}
        dataSource={dataSource || filteredData}
        loading={loading}
        rowKey={rowKey}
        rowSelection={rowSelection}
        pagination={pagination}
        size={tableSize}
        scroll={scroll}
        expandable={expandable}
        summary={summary}
        onChange={onChange}
        onRow={(record) => ({
          onClick: onRowClick ? () => onRowClick(record) : undefined,
          style: { cursor: onRowClick ? 'pointer' : 'default' }
        })}
        className="datatable-main"
      />
      
      {/* Selection info */}
      {selectable && selectedRowKeys.length > 0 && (
        <div className="selection-info" style={{ marginTop: 16, padding: 8, background: '#f0f2f5', borderRadius: 4 }}>
          <Text>
            Đã chọn {selectedRowKeys.length} trong {filteredData.length} mục
            <Button 
              type="link" 
              size="small" 
              onClick={() => setSelectedRowKeys([])}
              style={{ padding: 0, marginLeft: 8 }}
            >
              Bỏ chọn tất cả
            </Button>
          </Text>
        </div>
      )}
    </div>
  );
};

export default DataTable;