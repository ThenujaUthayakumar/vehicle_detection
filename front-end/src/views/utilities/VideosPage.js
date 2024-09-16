import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Typography, Grid, Button, TextField, Dialog, DialogActions, DialogContent,
  DialogContentText, DialogTitle, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Paper, Snackbar, Alert, Switch
} from '@mui/material';
import { saveAs } from 'file-saver';
import { IconEdit, IconTrash } from '@tabler/icons-react';

const VideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    videoTitle: '',
    videoLocation: '',
    video: null
  });
  const [fileName, setFileName] = useState('');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openErrorSnackbar, setOpenErrorSnackbar] = useState(false);

  useEffect(() => {
    fetchVideos();
  }, [page, rowsPerPage, searchTerm]);

  const getAuthToken = () => localStorage.getItem('access-token');

  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/video', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search_key: searchTerm
        },
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const data = response.data;
      setVideos(data.data);
      setTotalCount(data.total_count);
    } catch (error) {
      console.error('Fetch videos error:', error);
      setErrorMessage(error.response?.data?.detail || 'An error occurred');
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

  const handleOpen = (video = null) => {
    setIsEdit(!!video);
    setSelectedVideo(video);
    setFormData(video ? { 
      videoTitle: video.video_title,
      videoLocation: video.video_location,
      video: null 
    } : {
      videoTitle: '',
      videoLocation: '',
      video: null
    });
    setFileName('');
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormErrors({});
    setFormData({
      videoTitle: '',
      videoLocation: '',
      video: null
    });
    setFileName('');
  };

  const handleSubmit = async () => {
    const errors = {};
    if (!formData.videoTitle) errors.videoTitle = 'Video Title is required';
    if (!formData.videoLocation) errors.videoLocation = 'Video Location is required';
    if (!formData.video && !isEdit) errors.video = 'Video file is required';
  
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) return;
  
    const formDataToSend = new FormData();
    formDataToSend.append('videoTitle', formData.videoTitle);
    formDataToSend.append('videoLocation', formData.videoLocation);
    if (formData.video) formDataToSend.append('video', formData.video);
    if (isEdit) formDataToSend.append('id', selectedVideo.id);
  
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          'Content-Type': 'multipart/form-data'
        }
      };
  
      if (isEdit) {
        await axios.put('http://127.0.0.1:8000/video/update', formDataToSend, config);
        setSuccessMessage('Video updated successfully');
      } else {
        await axios.post('http://127.0.0.1:8000/video', formDataToSend, config);
        setSuccessMessage('Video created successfully');
      }
      fetchVideos();
      setOpenSnackbar(true);
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
      setErrorMessage(error.response?.data?.detail || 'An error occurred');
      setOpenErrorSnackbar(true);
    }
  };  

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://127.0.0.1:8000/video/${id}`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      setSuccessMessage('Video Deleted successfully');
      fetchVideos();
      setOpenSnackbar(true);
    } catch (error) {
      setErrorMessage(error.response?.data?.detail);
      setOpenErrorSnackbar(true);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'video') {
      setFormData({ ...formData, [name]: files[0] });
      setFileName(files[0].name);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/video/download', {
        params: {
          search_key: searchTerm
        },
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, 'vidoes.xlsx');
      setSuccessMessage('Excel file downloaded successfully');
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Download error:', error);
      setErrorMessage(error.response?.data?.detail || 'An error occurred');
      setOpenErrorSnackbar(true);
    }
  };

  const handleStatusChange = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 1 ? 0 : 1;
      await axios.put('http://127.0.0.1:8000/video/status-change', 
        { id, status: newStatus }, 
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setSuccessMessage(`Status updated to ${newStatus === 1 ? 'Active' : 'Inactive'}`);
      fetchVideos();
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Status change error:', error);
      setErrorMessage(error.response?.data?.detail || 'An error occurred');
      setOpenErrorSnackbar(true);
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Videos
      </Typography>
      <Grid container spacing={3}>
        <Grid item sm={12}>
          <Paper style={{ padding: '20px' }}>
            <Grid container justifyContent="space-between" alignItems="center">
              <Grid item>
                <Button variant="contained" color="primary" onClick={() => handleOpen()}>
                  Create Video
                </Button>
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
                    <TableCell>Reference Number</TableCell>
                    <TableCell>Title</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Updated At</TableCell>
                    <TableCell>Video</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {videos.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9}>No videos found</TableCell>
                    </TableRow>
                  ) : (
                    videos.map((video) => (
                      <TableRow key={video.id}>
                        <TableCell>{video.id}</TableCell>
                        <TableCell>{video.reference_number}</TableCell>
                        <TableCell>{video.video_title}</TableCell>
                        <TableCell>{video.video_location}</TableCell>
                        <TableCell>{video.user.reference_number}</TableCell>
                        <TableCell>
                          <Switch
                            checked={video.status === 1}
                            onChange={() => handleStatusChange(video.id, video.status)}
                          />
                        </TableCell>
                        <TableCell>{video.created_at}</TableCell>
                        <TableCell>{video.updated_at}</TableCell>
                        <TableCell>
                          <a href={video.video} target="_blank" rel="noopener noreferrer">
                            View
                          </a>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="secondary"
                            startIcon={<IconEdit />}
                            onClick={() => handleOpen(video)}
                          >
                          
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={<IconTrash />}
                            onClick={() => handleDelete(video.id)}
                          >
                            
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={totalCount}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </Paper>
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
        <DialogTitle>{isEdit ? 'Edit Video' : 'Create Video'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {isEdit ? 'Edit the video details and upload a new video if needed.' : 'Fill in the video details and upload a video.'}
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            name="videoTitle"
            label="Video Title"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.videoTitle}
            onChange={handleChange}
            error={!!formErrors.videoTitle}
            helperText={formErrors.videoTitle}
          />
          <TextField
            margin="dense"
            name="videoLocation"
            label="Video Location"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.videoLocation}
            onChange={handleChange}
            error={!!formErrors.videoLocation}
            helperText={formErrors.videoLocation}
          />
          <input
            accept="video/*"
            id="video-upload"
            name="video"
            type="file"
            style={{ display: 'none' }}
            onChange={handleChange}
          />
          <label htmlFor="video-upload">
            <Button variant="contained" component="span">
              Upload Video
            </Button>
          </label>
          <Typography variant="body2" color="textSecondary">
            {fileName}
          </Typography>
          {formErrors.video && <Typography variant="body2" color="error">{formErrors.video}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary">
            {isEdit ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default VideosPage;
