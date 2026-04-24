import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  Timeline,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  App,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import api from '../../lib/api';
import type { Project } from '../../types';

const { RangePicker } = DatePicker;

interface ProjectPhasesProps {
  project: Project;
}

export default function ProjectPhases({ project }: ProjectPhasesProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch phases
  const { data: phases = [] } = useQuery({
    queryKey: ['phases', project.id],
    queryFn: () => api.getPhases(project.id),
  });

  // Add phase mutation
  const addPhaseMutation = useMutation({
    mutationFn: (data: any) => api.createPhase(project.id, data),
    onSuccess: () => {
      message.success(t('projects.phaseAdded'));
      queryClient.invalidateQueries({ queryKey: ['phases', project.id] });
      setIsModalOpen(false);
      form.resetFields();
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message || t('common.error'));
    },
  });

  const handleAddPhase = async () => {
    try {
      const values = await form.validateFields();
      const phaseData = {
        ...values,
        startDate: values.dates[0].toISOString(),
        endDate: values.dates[1].toISOString(),
      };
      delete phaseData.dates;
      addPhaseMutation.mutate(phaseData);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getPhaseStatus = (phase: any) => {
    const now = new Date();
    const start = new Date(phase.startDate);
    const end = new Date(phase.endDate);

    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'active';
  };

  return (
    <div>
      <Card
        title={t('projects.phases')}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
            {t('projects.addPhase')}
          </Button>
        }
      >
        {phases.length === 0 ? (
          <Empty description={t('projects.noPhases')} />
        ) : (
          <Timeline mode="left">
            {phases
              .sort((a: any, b: any) => a.order - b.order)
              .map((phase: any) => {
                const status = getPhaseStatus(phase);
                return (
                  <Timeline.Item
                    key={phase.id}
                    dot={
                      status === 'completed' ? (
                        <CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />
                      ) : (
                        <ClockCircleOutlined style={{ fontSize: '16px' }} />
                      )
                    }
                    color={status === 'active' ? 'blue' : status === 'completed' ? 'green' : 'gray'}
                  >
                    <Space direction="vertical" size="small">
                      <Space>
                        <strong>{phase.name}</strong>
                        <Tag color={status === 'active' ? 'blue' : status === 'completed' ? 'green' : 'default'}>
                          {status === 'active' ? t('projects.status_in_progress') : 
                           status === 'completed' ? t('projects.status_completed') : 
                           t('projects.status_planning')}
                        </Tag>
                      </Space>
                      <div style={{ color: '#8c8c8c', fontSize: '12px' }}>
                        {new Date(phase.startDate).toLocaleDateString()} - {new Date(phase.endDate).toLocaleDateString()}
                      </div>
                    </Space>
                  </Timeline.Item>
                );
              })}
          </Timeline>
        )}
      </Card>

      {/* Add Phase Modal */}
      <Modal
        title={t('projects.addPhase')}
        open={isModalOpen}
        onOk={handleAddPhase}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
        }}
        confirmLoading={addPhaseMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('projects.phaseName')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="order"
            label={t('projects.phaseOrder')}
            rules={[{ required: true, message: t('common.required') }]}
            initialValue={phases.length + 1}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="dates"
            label={t('projects.dates')}
            rules={[{ required: true, message: t('common.required') }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
