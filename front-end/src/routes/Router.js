import React, { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import Loadable from '../layouts/full/shared/loadable/Loadable';
import PrivateRoute from './PrivateRoute';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/dashboard/Dashboard')));
const VehiclePage = Loadable(lazy(() => import('../views/utilities/VehiclePage')));
const UsersPage = Loadable(lazy(() => import('../views/utilities/UsersPage')));
const VideosPage = Loadable(lazy(() => import('../views/utilities/VideosPage')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Register = Loadable(lazy(() => import('../views/authentication/Register')));
const Login = Loadable(lazy(() => import('../views/authentication/Login')));

const Router = [
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/auth/login" /> },
      // Protect the dashboard and other routes with PrivateRoute
      { path: '/dashboard', exact: true, element: <PrivateRoute element={<Dashboard />} /> },
      { path: '/vehicle/view', exact: true, element: <PrivateRoute element={<VehiclePage />} /> },
      { path: '/users/view', exact: true, element: <PrivateRoute element={<UsersPage />} /> },
      { path: '/videos/view', exact: true, element: <PrivateRoute element={<VideosPage />} /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '/auth/login', element: <Login /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
];

export default Router;
