import React, { useState } from 'react';
import {
    Box,
    Typography,
    Button,
    Stack,
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomTextField from '../../../components/forms/theme-elements/CustomTextField';

const AuthLogin = ({ title, subtitle, subtext }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('grant_type', 'password');
        formData.append('username', username);
        formData.append('password', password);

        try {
            const response = await axios.post('http://127.0.0.1:8000/login', formData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded', 
                },
            });

            if (response.status === 200) {
                console.log(response.data);
                
                localStorage.setItem('access-token', response.data.access_token); 

                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError('Invalid login credentials. Please try again.');
        }
    };

    return (
        <>
            {title ? (
                <Typography fontWeight="700" variant="h2" mb={1}>
                    {title}
                </Typography>
            ) : null}

            {subtext}

            <form onSubmit={handleLogin}>
                <Stack>
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor='username' mb="5px">Username</Typography>
                        <CustomTextField
                            id="username"
                            variant="outlined"
                            fullWidth
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </Box>
                    <Box mt="25px">
                        <Typography variant="subtitle1" fontWeight={600} component="label" htmlFor='password' mb="5px" >Password</Typography>
                        <CustomTextField
                            id="password"
                            type="password"
                            variant="outlined"
                            fullWidth
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </Box>
                    {error && (
                        <Typography color="error" mt={2}>
                            {error}
                        </Typography>
                    )}
                    <Stack justifyContent="space-between" direction="row" alignItems="center" my={2}>
                        <Typography
                            component={Link}
                            to="/"
                            fontWeight="500"
                            sx={{
                                textDecoration: 'none',
                                color: 'primary.main',
                            }}
                        >
                        </Typography>
                    </Stack>
                </Stack>
                <Box>
                    <Button
                        color="primary"
                        variant="contained"
                        size="large"
                        fullWidth
                     type="submit"
                    >
                        Sign In
                    </Button>
                </Box>
            </form>
            {subtitle}
        </>
    );
};

export default AuthLogin;
