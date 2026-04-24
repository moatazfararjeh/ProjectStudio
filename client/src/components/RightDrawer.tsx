import { Drawer, Button, Space } from 'antd';
import type { ReactNode } from 'react';

interface RightDrawerProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  confirmLoading?: boolean;
  submitText?: string;
  cancelText?: string;
  width?: number;
  children: ReactNode;
  extra?: ReactNode;
}

export default function RightDrawer({
  open,
  title,
  onClose,
  onSubmit,
  confirmLoading = false,
  submitText = 'Save',
  cancelText = 'Cancel',
  width = 480,
  children,
  extra,
}: RightDrawerProps) {
  return (
    <Drawer
      title={title}
      placement="right"
      open={open}
      onClose={onClose}
      width={width}
      destroyOnClose
      styles={{
        header: {
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          padding: '16px 24px',
          fontWeight: 600,
          fontSize: 16,
        },
        body: {
          padding: '24px',
          overflowY: 'auto',
        },
        footer: {
          padding: '12px 24px',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        },
      }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          {extra}
          <Button onClick={onClose}>{cancelText}</Button>
          <Button
            type="primary"
            onClick={onSubmit}
            loading={confirmLoading}
          >
            {submitText}
          </Button>
        </Space>
      }
    >
      {children}
    </Drawer>
  );
}
