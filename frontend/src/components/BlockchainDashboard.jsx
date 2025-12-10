import React, { useState } from 'react';
import {
  Box,
  Container,
  Tabs,
  Tab,
  Typography,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import WalletConnection from './WalletConnection';
import BlockchainTaskCRUD from './BlockchainTaskCRUD';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';

/**
 * Tab Panel Component
 */
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`blockchain-tabpanel-${index}`}
      aria-labelledby={`blockchain-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const BlockchainDashboard = ({ userId }) => {
  const [tabValue, setTabValue] = useState(0);
  const [walletInfo, setWalletInfo] = useState(null);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleWalletConnect = (wallet) => {
    setWalletInfo(wallet);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #091057 0%, #0d1b73 100%)',
        pt: 4,
        pb: 4,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 'bold',
              color: 'white',
              mb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 40 }} />
            Blockchain-Integrated Note App
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{
              color: '#ccc',
              mb: 3,
            }}
          >
            Create, manage, and track your notes on the Cardano blockchain using Lace Wallet
          </Typography>

          {/* Quick Info */}
          <Paper
            sx={{
              p: 2,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Network
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  🔗 Cardano Preprod
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Wallet
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  {walletInfo ? `✅ ${walletInfo.walletName}` : '⏳ Not Connected'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Standard API
                </Typography>
                <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 'bold' }}>
                  📋 CIP-0030
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" sx={{ color: '#aaa' }}>
                  Reference
                </Typography>
                <Button
                  href="https://www.cardano-caniuse.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<LinkIcon />}
                  sx={{
                    color: '#1976d2',
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    p: 0,
                    minWidth: 'auto',
                  }}
                >
                  Cardano Can I Use
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* Tabs Section */}
        <Paper
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Tab Headers */}
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="blockchain features"
            sx={{
              backgroundColor: '#091057',
              '& .MuiTab-root': {
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1rem',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#EC8305',
              },
              '& .MuiTab-root.Mui-selected': {
                backgroundColor: 'rgba(236, 131, 5, 0.1)',
              },
            }}
          >
            <Tab
              label="🔐 Wallet Connection"
              icon={<AccountBalanceWalletIcon />}
              iconPosition="start"
              aria-label="wallet connection"
            />
            <Tab
              label="📝 Tasks & CRUD"
              icon={<AssignmentIcon />}
              iconPosition="start"
              aria-label="blockchain tasks"
            />
            <Tab
              label="ℹ️ Information"
              icon={<InfoIcon />}
              iconPosition="start"
              aria-label="information"
            />
          </Tabs>

          {/* Tab Content */}

          {/* Tab 1: Wallet Connection */}
          <TabPanel value={tabValue} index={0}>
            <WalletConnection onWalletConnect={handleWalletConnect} />
          </TabPanel>

          {/* Tab 2: Blockchain Tasks */}
          <TabPanel value={tabValue} index={1}>
            <BlockchainTaskCRUD userId={userId} walletInfo={walletInfo} />
          </TabPanel>

          {/* Tab 3: Information */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#091057' }}>
                Blockchain Integration Information
              </Typography>

              <Divider sx={{ mb: 3 }} />

              {/* Section 1: How it Works */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🎯 How It Works
                </Typography>
                <Typography variant="body2" paragraph>
                  1. <strong>Connect Wallet:</strong> Go to "Wallet Connection" tab and connect your Lace wallet using the CIP-0030 standard API.
                </Typography>
                <Typography variant="body2" paragraph>
                  2. <strong>Create Tasks:</strong> Switch to "Tasks & CRUD" tab and create new blockchain-enabled tasks.
                </Typography>
                <Typography variant="body2" paragraph>
                  3. <strong>View Transactions:</strong> Each action (create, update, delete) generates a blockchain transaction simulation.
                </Typography>
                <Typography variant="body2" paragraph>
                  4. <strong>Sync Wallet:</strong> Use the sync button to ensure your wallet is up-to-date with the latest network state.
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Section 2: Technology Stack */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🛠️ Technology Stack
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Frontend:</strong>
                  <ul style={{ margin: '8px 0' }}>
                    <li>React 18.3.1</li>
                    <li>Material-UI 6.1.6</li>
                    <li>@utxorpc/blaze-provider</li>
                    <li>@blaze-cardano/sdk</li>
                    <li>Axios (HTTP client)</li>
                  </ul>
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Backend:</strong>
                  <ul style={{ margin: '8px 0' }}>
                    <li>Spring Boot 3.5.6</li>
                    <li>Java 17</li>
                    <li>MySQL 8.0</li>
                    <li>JPA/Hibernate</li>
                  </ul>
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Blockchain:</strong>
                  <ul style={{ margin: '8px 0' }}>
                    <li>Cardano Preprod Network</li>
                    <li>Lace Wallet (CIP-0030)</li>
                    <li>Blaze SDK 0.2.44</li>
                    <li>UTXO RPC 0.3.7</li>
                  </ul>
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Section 3: API Endpoints */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📡 API Endpoints
                </Typography>
                <Typography variant="body2" component="div">
                  <strong>Blockchain Endpoints:</strong>
                  <ul style={{ margin: '8px 0' }}>
                    <li>GET /api/blockchain/network-config</li>
                    <li>POST /api/blockchain/validate-wallet</li>
                    <li>POST /api/blockchain/simulate-note-transaction</li>
                    <li>POST /api/blockchain/simulate-note-update-transaction</li>
                    <li>POST /api/blockchain/simulate-note-deletion-transaction</li>
                    <li>GET /api/blockchain/caniuse-features</li>
                  </ul>
                </Typography>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Section 4: Resources */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  📚 Resources
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Cardano Can I Use:</strong>{' '}
                  <a href="https://www.cardano-caniuse.io/" target="_blank" rel="noopener noreferrer">
                    https://www.cardano-caniuse.io/
                  </a>
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>CIP-0030 Standard API:</strong> Cardano Standard Wallet Protocol
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Lace Wallet:</strong> Official Cardano wallet with CIP-0030 support
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Blaze SDK:</strong> Type-safe Cardano SDK for JavaScript
                </Typography>
              </Box>
            </Box>
          </TabPanel>
        </Paper>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: '#aaa' }}>
            🚀 Blockchain-Integrated Note App • Cardano Preprod Network • CIP-0030 Standard API
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default BlockchainDashboard;
