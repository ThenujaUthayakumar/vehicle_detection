import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { Grid, Typography } from '@mui/material';
import DashboardCard from '../../../components/shared/DashboardCard';

const VehicleDistributionPieChart = () => {
  const theme = useTheme();
  const [vehicleData, setVehicleData] = useState({
    vehicleNames: [],
    counts: []
  });

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/vehicle-counts', {
          params: {
          }
        });
        const apiData = response.data;

        const vehicleNames = [...new Set(apiData.map(item => item.vehicle_name))];
        const vehicleCounts = vehicleNames.map(name => {
          return apiData
            .filter(item => item.vehicle_name === name)
            .reduce((acc, curr) => acc + curr.total_counts, 0);
        });

        setVehicleData({
          vehicleNames,
          counts: vehicleCounts
        });
      } catch (error) {
        console.error('Error fetching vehicle data', error);
      }
    };

    fetchVehicleData();
  }, []);

  const optionsPieChart = {
    chart: {
      type: 'pie',
      width: '100%',
      toolbar: {
        show: true
      }
    },
    labels: vehicleData.vehicleNames,
    colors: [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.error.main, theme.palette.warning.main, theme.palette.success.main],
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: '100%'
        },
        legend: {
          position: 'bottom'
        }
      }
    }],
    tooltip: {
      theme: theme.palette.mode === 'dark' ? 'dark' : 'light'
    }
  };

  const seriesPieChart = vehicleData.counts;

  return (
    <DashboardCard title="Vehicle Distribution by Type">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Vehicle Type Distribution
          </Typography>
          <Chart
            options={optionsPieChart}
            series={seriesPieChart}
            type="pie"
            height="350px"
            width="100%"
          />
        </Grid>
      </Grid>
    </DashboardCard>
  );
};

export default VehicleDistributionPieChart;
