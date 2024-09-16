import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { Grid, Typography } from '@mui/material';
import DashboardCard from '../../../components/shared/DashboardCard';

const DateWiseVehicleCounts = () => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  // State to hold date-wise vehicle data
  const [vehicleData, setVehicleData] = useState({
    dates: [],   
    counts: [] ,
    vehicleNames: []  
  });

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/vehicle-counts', {
          params: {
          }
        });
        const apiData = response.data;

        const updatedDates = apiData.map((item) => item.date);
        const updatedCounts = apiData.map((item) => item.total_counts);
        const updatedVehicleNames = apiData.map((item) => item.vehicle_name);

        setVehicleData({
          dates: updatedDates,
          counts: updatedCounts,
          vehicleNames: updatedVehicleNames,
        });
      } catch (error) {
        console.error('Error fetching vehicle data', error);
      }
    };

    fetchVehicleData();
  }, []); 

  const optionsLineChart = {
    chart: {
      type: 'line',
      height: 350,
      zoom: {
        enabled: false,
      },
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: 'smooth',
      width: 2,
    },
    xaxis: {
      categories: vehicleData.dates,
      title: {
        text: 'Date',
      },
    },
    yaxis: {
      title: {
        text: 'Vehicle Counts',
      },
    },
    colors: [primary],
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light',
      y: {
        formatter: function (value, { seriesIndex, dataPointIndex }) {
          return `${value} (${vehicleData.vehicleNames[dataPointIndex]})`;
        }
      }
    },
    markers: {
      size: 4,
    },
    grid: {
      borderColor: '#e7e7e7',
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      position: 'top',
      horizontalAlign: 'right',
      floating: true,
      offsetY: -25,
      offsetX: -5,
    },
  };

  const seriesLineChart = [
    {
      name: 'Vehicle Counts',
      data: vehicleData.counts
    }
  ];

  return (
    <DashboardCard title="Date-Wise Vehicle Counts">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Vehicle Counts Over Time
          </Typography>
          <Chart
            options={optionsLineChart}
            series={seriesLineChart}
            type="line"
            height="350px"
          />
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default DateWiseVehicleCounts;
