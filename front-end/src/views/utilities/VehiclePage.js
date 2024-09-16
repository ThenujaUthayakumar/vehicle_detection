import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Grid, Button, TextField, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, TablePagination, Paper, Snackbar, Alert
} from '@mui/material';
import { saveAs } from 'file-saver';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';

const VehiclePage = () => {
  const [vehicleCounts, setVehicleCounts] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchVehicleCounts();
  }, [page, rowsPerPage, searchTerm]);

  const fetchVehicleCounts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/vehicle-counts/all', {
        params: {
          vehicle_name: searchTerm,
          page: page + 1, // API expects 1-based page index
          limit: rowsPerPage,
        },
      });
      setVehicleCounts(response.data.data); // Accessing the nested data array
      setTotalCount(response.data.total_count); // Accessing the total_count from response
    } catch (error) {
      setErrorMessage('Error fetching vehicle counts');
      setOpenSnackbar(true);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0); // Reset to first page on new search
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/vehicle-counts/all/download', {
        params: { vehicle_name: searchTerm },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'vehicle_counts.xlsx');
    } catch (error) {
      setErrorMessage('Error downloading data');
      setOpenSnackbar(true);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page on rows per page change
  };

  return (
    <PageContainer title="Vehicle Counts" description="View and download vehicle count data">
      <Grid container spacing={3}>
        <Grid item sm={12}>
          <DashboardCard title="Vehicle Counts">
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <TextField
                  label="Search"
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={handleSearch}
                />
              </Grid>
              <Grid item>
                <Button variant="contained" color="secondary" onClick={handleDownload}>
                  Download
                </Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Vehicle Name</TableCell>
                    <TableCell>Count</TableCell>
                    <TableCell>Video Title</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {vehicleCounts.map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell>{vehicle.id}</TableCell>
                      <TableCell>{vehicle.vehicle_name}</TableCell>
                      <TableCell>{vehicle.total_counts}</TableCell>
                      <TableCell>{vehicle.video_title}</TableCell>
                      <TableCell>{vehicle.date}</TableCell> {/* Added date field */}
                      <TableCell>{vehicle.created_at}</TableCell>
                      <TableCell>{vehicle.updated_at}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </DashboardCard>
        </Grid>
      </Grid>

      <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
        <Alert onClose={() => setOpenSnackbar(false)} severity="error">
          {errorMessage}
        </Alert>
      </Snackbar>
    </PageContainer>
  );
};

export default VehiclePage;
