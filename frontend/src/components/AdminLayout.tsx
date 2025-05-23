import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  Settings as SettingsIcon,
  Receipt as ReceiptIcon,
  Sync as SyncIcon,
  Menu as MenuIcon,
  ExitToApp as LogoutIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  if (!user || user.role !== 'ADMIN') {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            K-Point Admin
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer}
        >
          <Box sx={{ p: 2 }}>
            <Typography variant="h6">
              {user?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administrator
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem button component={Link} to="/admin">
              <ListItemIcon>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItem>
            <ListItem button component={Link} to="/admin/users">
              <ListItemIcon>
                <PeopleIcon />
              </ListItemIcon>
              <ListItemText primary="Users" />
            </ListItem>
            <ListItem button component={Link} to="/admin/departments">
              <ListItemIcon>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Departments" />
            </ListItem>
            <ListItem button component={Link} to="/admin/config">
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Configuration" />
            </ListItem>
            <ListItem button component={Link} to="/admin/transactions">
              <ListItemIcon>
                <ReceiptIcon />
              </ListItemIcon>
              <ListItemText primary="Transactions" />
            </ListItem>
            <ListItem button component={Link} to="/admin/sync">
              <ListItemIcon>
                <SyncIcon />
              </ListItemIcon>
              <ListItemText primary="Google Sheets Sync" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: 8
        }}
      >
        <Container>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default AdminLayout;
