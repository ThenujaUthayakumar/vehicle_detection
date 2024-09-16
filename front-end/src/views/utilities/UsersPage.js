import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Grid, Button, TextField, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import PageContainer from 'src/components/container/PageContainer';
import DashboardCard from '../../components/shared/DashboardCard';
import { IconEdit, IconTrash } from '@tabler/icons-react';
import { saveAs } from 'file-saver'; // Make sure to import file-saver if using it


const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionType, setActionType] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    username: '',
    role: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    address: '',
    email: '',
  });

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/users', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search_key: searchTerm,
        },
      });

      const data = response.data;
      setUsers(data.data);
      setTotalCount(data.total_count);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'User Not Found');
      setOpenErrorSnackbar(true);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpen = (user = null) => {
    setIsEdit(!!user);
    setSelectedUser(user);
    setFormData(user ? {
      username: user.username,
      role: user.role,
      password: '', 
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number,
      address: user.address,
      email: user.email,
      id: user.id
    } : {
      username: '',
      role: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
      email: '',
      id: null
    });
    setFormErrors({});
    setOpen(true);
    setSuccessMessage('');
    setErrorMessage('');  
    setActionType(isEdit ? 'edit' : 'create'); 
  };
  

  const handleClose = () => {
    setOpen(false);
    setFormErrors({});
    setFormData({
      username: '',
      role: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      address: '',
      email: '',
      id: null
    });
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!formData.username) errors.username = 'Username is required';
    if (!formData.password && !isEdit) errors.password = 'Password is required';
    if (!formData.role) errors.role = 'Role is required';
    if (!formData.firstName) errors.firstName = 'First Name is required';
    if (!formData.lastName) errors.lastName = 'Last Name is required';
    if (!formData.phoneNumber) errors.phoneNumber = 'Phone Number is required';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.email) errors.email = 'Email is required';
  
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
  
    try {
      const token = localStorage.getItem('access_token');
      if (isEdit) {
        await axios.put(`http://127.0.0.1:8000/users`, {
          ...formData,
          id: formData.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setSuccessMessage('User updated successfully');
        setActionType('create');
      } else {
        await axios.post('http://127.0.0.1:8000/signup', formData);
        setSuccessMessage('User created successfully');
        setActionType('create');
      }
      fetchUsers();
      setOpenSnackbar(true);
      handleClose();
    } catch (error) {
      setErrorMessage(error.response?.data?.detail);
      setActionType('create');
      setOpenErrorSnackbar(true);
    }
  };  

  const handleDelete = async (id) => {
    const token = localStorage.getItem('access_token');
  
    try {
      await axios.delete(`http://127.0.0.1:8000/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setSuccessMessage('User deleted successfully');
      fetchUsers();
      setOpenSnackbar(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail);
      setOpenErrorSnackbar(true);
    }
  };
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleDownloadExcel = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/users/download', {
        params: {
          search_key: searchTerm,
        },
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'users.xlsx');
      setSuccessMessage('Excel file downloaded successfully');
      setOpenSnackbar(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail);
      setOpenErrorSnackbar(true);
    }
  };

  return (
    <PageContainer title="Users" description="this is Typography">
      <Grid container spacing={3} direction="column">
        <Grid item>
          <DashboardCard title="Users List">
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Button variant="contained" color="primary" onClick={() => handleOpen()}>Create User</Button>
              </Grid>
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
                <Button variant="contained" color="secondary" onClick={handleDownloadExcel}>Download</Button>
              </Grid>
            </Grid>

            <TableContainer component={Paper} style={{ marginTop: '20px' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>First Name</TableCell>
                    <TableCell>Last Name</TableCell>
                    <TableCell>Phone Number</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Reference Number</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.id}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.first_name}</TableCell>
                      <TableCell>{user.last_name}</TableCell>
                      <TableCell>{user.phone_number}</TableCell>
                      <TableCell>{user.address}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.reference_number}</TableCell>
                      <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                      <TableCell>{new Date(user.updated_at).toLocaleString()}</TableCell>
                      <TableCell>
                        <Button onClick={() => handleOpen(user)} variant="contained" color="secondary"><IconEdit /></Button>
                        <Button onClick={() => handleDelete(user.id)} variant="contained" color="error"><IconTrash /></Button>
                      </TableCell>
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

      <Snackbar
      open={openSnackbar}
      autoHideDuration={6000}
      onClose={() => setOpenSnackbar(false)}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }}
    >
      <Alert
        onClose={() => setOpenSnackbar(false)}
        severity="success"
        style={{
          fontSize: '1rem', 
          padding: '16px',    
        }}
      >
        {successMessage}
      </Alert>
    </Snackbar>


      {/* Error Snackbar */}
      <Snackbar
        open={openErrorSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenErrorSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)' }}
      >
        <Alert onClose={() => setOpenErrorSnackbar(false)} severity="error"         style={{
          fontSize: '1rem', 
          padding: '16px',    
        }}>
          {errorMessage}
        </Alert>
      </Snackbar>


      <Dialog open={open} onClose={handleClose}>
  <DialogTitle>{isEdit ? 'Edit User' : 'Create User'}</DialogTitle>
  <DialogContent>
    <DialogContentText>
      {isEdit ? 'Edit user details' : 'Fill in the details to create a new user'}
    </DialogContentText>
    
    <Snackbar
  open={openSnackbar && actionType === 'create'}
  autoHideDuration={6000}
  onClose={() => setOpenSnackbar(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  message={successMessage}
>
  <Alert
    onClose={() => setOpenSnackbar(false)}
    severity="success"
    style={{ fontSize: '1.25rem', padding: '16px' }}
  >
    {successMessage}
  </Alert>
</Snackbar>

<Snackbar
  open={openErrorSnackbar && actionType === 'create'}
  autoHideDuration={6000}
  onClose={() => setOpenErrorSnackbar(false)}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  message={errorMessage}
>
  <Alert
    onClose={() => setOpenErrorSnackbar(false)}
    severity="error"
    style={{ fontSize: '1.25rem', padding: '16px' }}
  >
    {errorMessage}
  </Alert>
</Snackbar>

    
    <TextField
      autoFocus
      margin="dense"
      id="username"
      label="Username"
      type="text"
      fullWidth
      variant="standard"
      name="username"
      value={formData.username}
      onChange={handleChange}
      error={Boolean(formErrors.username)}
      helperText={formErrors.username}
    />
    <FormControl fullWidth margin="dense" error={!!formErrors.role}>
      <InputLabel>Role</InputLabel>
      <Select
        name="role"
        value={formData.role}
        onChange={handleChange}
        label="Role"
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="user">User</MenuItem>
      </Select>
      {formErrors.role && <FormHelperText>{formErrors.role}</FormHelperText>}
    </FormControl>
    {!isEdit && (
      <TextField
        margin="dense"
        id="password"
        label="Password"
        type="password"
        fullWidth
        variant="standard"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={Boolean(formErrors.password)}
        helperText={formErrors.password}
      />
    )}
    <TextField
      margin="dense"
      id="firstName"
      label="First Name"
      type="text"
      fullWidth
      variant="standard"
      name="firstName"
      value={formData.firstName}
      onChange={handleChange}
      error={Boolean(formErrors.firstName)}
      helperText={formErrors.firstName}
    />
    <TextField
      margin="dense"
      id="lastName"
      label="Last Name"
      type="text"
      fullWidth
      variant="standard"
      name="lastName"
      value={formData.lastName}
      onChange={handleChange}
      error={Boolean(formErrors.lastName)}
      helperText={formErrors.lastName}
    />
    <TextField
      margin="dense"
      id="phoneNumber"
      label="Phone Number"
      type="text"
      fullWidth
      variant="standard"
      name="phoneNumber"
      value={formData.phoneNumber}
      onChange={handleChange}
      error={Boolean(formErrors.phoneNumber)}
      helperText={formErrors.phoneNumber}
    />
    <TextField
      margin="dense"
      id="address"
      label="Address"
      type="text"
      fullWidth
      variant="standard"
      name="address"
      value={formData.address}
      onChange={handleChange}
      error={Boolean(formErrors.address)}
      helperText={formErrors.address}
    />
    <TextField
      margin="dense"
      id="email"
      label="Email"
      type="email"
      fullWidth
      variant="standard"
      name="email"
      value={formData.email}
      onChange={handleChange}
      error={Boolean(formErrors.email)}
      helperText={formErrors.email}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Create'}</Button>
  </DialogActions>
</Dialog>
    </PageContainer>
  );
};

export default UsersPage;
