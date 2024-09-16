import React, { useState, useEffect } from 'react';
import { Select, MenuItem, TextField, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import DashboardCard from '../../../components/shared/DashboardCard';
import Chart from 'react-apexcharts';
import axios from 'axios';

const VehicleOverview = () => {
  // State for selected month
  const [month, setMonth] = useState('1');
  
  // State for start_date and end_date
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // State for chart data
  const [vehicleData, setVehicleData] = useState({
    categories: [], 
    counts: []     
  });


  const handleMonthChange = (event) => {
    setMonth(event.target.value);
  };

  // Fetch vehicle counts data from the API
  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const params = { month: month };
        if (startDate) params.start_date = startDate; 
        if (endDate) params.end_date = endDate;      

        const response = await axios.get('http://127.0.0.1:8000/vehicle-counts', { params });
        const apiData = response.data;

        const updatedCategories = apiData.map((item) => item.vehicle_name); 
        const updatedCounts = apiData.map((item) => item.total_counts); 

        setVehicleData({
          categories: updatedCategories,
          counts: updatedCounts,
        });
      } catch (error) {
        console.error('Error fetching vehicle data', error);
      }
    };

    fetchVehicleData();
  }, [month, startDate, endDate]); 

  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const secondary = theme.palette.secondary.main;

  const optionscolumnchart = {
    chart: {
      type: 'bar',
      fontFamily: "'Plus Jakarta Sans', sans-serif;",
      foreColor: '#adb0bb',
      toolbar: { show: true },
      height: 370,
    },
    colors: [primary, secondary],
    plotOptions: {
      bar: {
        horizontal: false,
        barHeight: '60%',
        columnWidth: '42%',
        borderRadius: [6],
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'all',
      },
    },
    stroke: {
      show: true,
      width: 5,
      lineCap: 'butt',
      colors: ['transparent'],
    },
    dataLabels: { enabled: false },
    legend: { show: false },
    grid: {
      borderColor: 'rgba(0,0,0,0.1)',
      strokeDashArray: 3,
      xaxis: { lines: { show: false } },
    },
    yaxis: { tickAmount: 4 },
    xaxis: {
      categories: vehicleData.categories,
      axisBorder: { show: false },
    },
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      fillSeriesColor: false,
    },
  };

  const seriescolumnchart = [
    {
      name: 'Vehicle Counts',
      data: vehicleData.counts,
    },
  ];

  return (
    <DashboardCard
      title="Vehicle Counts Overview"
      action={
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            id="start-date"
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            id="end-date"
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>
      }
    >
      <Chart
        options={optionscolumnchart}
        series={seriescolumnchart}
        type="bar"
        height="370px"
      />
    </DashboardCard>
  );
};

export default VehicleOverview;
