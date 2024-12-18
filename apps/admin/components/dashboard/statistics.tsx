'use client';

import { queryServerTotalData, queryTicketWaitReply } from '@/services/admin/console';
import { Icon } from '@iconify/react';
import { formatBytes, unitConversion } from '@repo/ui/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@shadcn/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@shadcn/ui/chart';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from '@shadcn/ui/lib/recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@shadcn/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@shadcn/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { Empty } from '../empty';
import { RevenueStatisticsCard } from './revenue-statistics-card';
import { UserStatisticsCard } from './user-statistics-card';

export default function Statistics() {
  const t = useTranslations('index');

  const { data: TicketTotal } = useQuery({
    queryKey: ['queryTicketWaitReply'],
    queryFn: async () => {
      const { data } = await queryTicketWaitReply();
      return data.data?.count;
    },
  });
  const { data: ServerTotal } = useQuery({
    queryKey: ['queryServerTotalData'],
    queryFn: async () => {
      const { data } = await queryServerTotalData();
      return data.data;
    },
  });

  const [dataType, setDataType] = useState<string | 'nodes' | 'users'>('nodes');
  const [timeFrame, setTimeFrame] = useState<string | 'today' | 'yesterday'>('today');

  const trafficData = {
    nodes: {
      today:
        ServerTotal?.server_traffic_ranking_today?.map((item) => ({
          name: item.name,
          traffic: item.download + item.upload,
        })) || [],
      yesterday:
        ServerTotal?.server_traffic_ranking_yesterday?.map((item) => ({
          name: item.name,
          traffic: item.download + item.upload,
        })) || [],
    },
    users: {
      today:
        ServerTotal?.user_traffic_ranking_today?.map((item) => ({
          name: item.user_id,
          traffic: item.download + item.upload,
          email: item.email,
        })) || [],
      yesterday:
        ServerTotal?.user_traffic_ranking_yesterday?.map((item) => ({
          name: item.user_id,
          traffic: item.download + item.upload,
          email: item.email,
        })) || [],
    },
  };

  const currentData = trafficData[dataType][timeFrame];

  return (
    <>
      <h1 className='text-lg font-semibold'>{t('statisticsTitle')}</h1>
      <div className='grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8'>
        {[
          {
            title: t('onlineIPCount'),
            value: ServerTotal?.online_user_ips || 0,
            icon: 'uil:users-alt',
            href: '/dashboard/server',
          },
          {
            title: t('onlineNodeCount'),
            value: ServerTotal?.online_servers || 0,
            icon: 'uil:server-network',
            href: '/dashboard/server',
          },
          {
            title: t('offlineNodeCount'),
            value: ServerTotal?.offline_servers || 0,
            icon: 'uil:server-network-alt',
            href: '/dashboard/server',
          },
          {
            title: t('pendingTickets'),
            value: TicketTotal || 0,
            icon: 'uil:clipboard-notes',
            href: '/dashboard/ticket',
          },
          {
            title: t('todayUploadTraffic'),
            value: formatBytes(ServerTotal?.upload_traffic_today || 0),
            icon: 'uil:arrow-up',
          },
          {
            title: t('todayDownloadTraffic'),
            value: formatBytes(ServerTotal?.download_traffic_today || 0),
            icon: 'uil:arrow-down',
          },
          {
            title: t('monthUploadTraffic'),
            value: formatBytes(ServerTotal?.upload_traffic_month || 0),
            icon: 'uil:cloud-upload',
          },
          {
            title: t('monthDownloadTraffic'),
            value: formatBytes(ServerTotal?.download_traffic_month || 0),
            icon: 'uil:cloud-download',
          },
        ].map((item, index) => (
          <Link href={item.href || '#'} key={index}>
            <Card className='cursor-pointer'>
              <CardHeader className='p-4'>
                <CardTitle>{item.title}</CardTitle>
              </CardHeader>
              <CardContent className='flex justify-between p-4 text-xl'>
                <Icon icon={item.icon} className='text-muted-foreground' />
                <div className='text-xl font-bold tabular-nums leading-none'>{item.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
        <RevenueStatisticsCard />
        <UserStatisticsCard />
        <Card>
          <CardHeader className='flex !flex-row items-center justify-between'>
            <CardTitle>{t('trafficRank')}</CardTitle>
            <Tabs value={timeFrame} onValueChange={setTimeFrame}>
              <TabsList>
                <TabsTrigger value='today'>{t('today')}</TabsTrigger>
                <TabsTrigger value='yesterday'>{t('yesterday')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className='mb-6 flex items-center justify-between'>
              <h4 className='font-semibold'>
                {dataType === 'nodes' ? t('nodeTraffic') : t('userTraffic')}
              </h4>
              <Select onValueChange={setDataType} defaultValue='nodes'>
                <SelectTrigger className='w-28'>
                  <SelectValue placeholder={t('selectTypePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='nodes'>{t('nodes')}</SelectItem>
                  <SelectItem value='users'>{t('users')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {currentData.length > 0 ? (
              <ChartContainer
                config={{
                  traffic: {
                    label: t('todayUploadTraffic'),
                    color: 'hsl(var(--primary))',
                  },
                  type: {
                    label: t('type'),
                    color: 'hsl(var(--muted))',
                  },
                  email: {
                    label: t('email'),
                    color: 'hsl(var(--muted))',
                  },
                  label: {
                    color: 'hsl(var(--foreground))',
                  },
                }}
                className='max-h-80'
              >
                <BarChart data={currentData} layout='vertical' height={400}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    type='number'
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => formatBytes(unitConversion('gbToBytes', value) || 0)}
                  />
                  <YAxis
                    type='category'
                    dataKey='name'
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tickMargin={0}
                    width={15}
                    tickFormatter={(value, index) => String(index + 1)}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        label={false}
                        labelFormatter={(label) =>
                          dataType === 'nodes'
                            ? `${t('nodes')}: ${label}`
                            : `${t('users')}: ${label}`
                        }
                      />
                    }
                  />
                  <Bar dataKey='traffic' fill='hsl(var(--primary))' radius={[0, 4, 4, 0]}>
                    <LabelList
                      dataKey='name'
                      position='insideLeft'
                      offset={8}
                      className='fill-[--color-label]'
                      fontSize={12}
                    />
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <Empty />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
