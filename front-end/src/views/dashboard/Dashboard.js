import React from 'react';
import { Grid, Box } from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';

// components
import VehicleOverview from './components/VehicleOverview';
import LineChart from './components/LineChart';
import PieChart from './components/PieChart';


const Dashboard = () => {
  return (
    <PageContainer title="Dashboard" description="this is Dashboard">
      <Box>
        <Grid container spacing={3}>
          <Grid item xs={12} lg={12}>
            <VehicleOverview />
          </Grid>
          <Grid item xs={12} lg={12}>
                <LineChart />
              </Grid>
          <Grid item xs={12} lg={12}>
            <PieChart />
          </Grid>
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Dashboard;
