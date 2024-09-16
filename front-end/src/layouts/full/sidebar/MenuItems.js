import {
  IconUserCircle,IconLayoutDashboard, IconPhotoVideo, IconCarCrane
} from '@tabler/icons-react';

import { uniqueId } from 'lodash';

const Menuitems = [
  {
    navlabel: true,
    subheader: 'Home',
  },

  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/dashboard',
  },
  {
    navlabel: true,
    subheader: 'Users',
  },
  {
    id: uniqueId(),
    title: 'Users',
    icon: IconUserCircle,
    href: '/users/view',
  },
  {
    navlabel: true,
    subheader: 'Traffic',
  },
  {
    id: uniqueId(),
    title: 'Traffic Videos',
    icon: IconPhotoVideo,
    href: '/videos/view',
  },
  {
    id: uniqueId(),
    title: 'Vehicle Details',
    icon: IconCarCrane,
    href: '/vehicle/view',
  },
];

export default Menuitems;
