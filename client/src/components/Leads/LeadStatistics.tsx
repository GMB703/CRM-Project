import React, { useState, useEffect } from 'react';
import {
  Paper,
  Grid,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  MonetizationOn as MonetizationOnIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { leadService, LeadStatistics as LeadStats } from '../../services/leadService';

const LeadStatistics = () => {
  const [statistics, setStatistics] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStatistics = async () => {
      try {
        setLoading(true);
        const data = await leadService.getLeadStatistics();
        setStatistics(data);
      } catch (err) {
        setError('Failed to load statistics');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStatistics();
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Paper>
    );
  }

  if (!statistics) {
    return null;
  }

  const StatCard = ({
    title,
    value,
    icon: Icon,
    trend,
    color = 'primary',
  }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    trend?: number;
    color?: string;
  }) => (
    <Paper sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2" color="textSecondary">
            {title}
          </Typography>
          <Icon color={color as any} />
        </Box>
        <Typography variant="h4">{value}</Typography>
        {trend !== undefined && (
          <Box display="flex" alignItems="center" gap={1}>
            {trend >= 0 ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={trend >= 0 ? 'success.main' : 'error.main'}
            >
              {Math.abs(trend)}% from last month
            </Typography>
          </Box>
        )}
      </Stack>
    </Paper>
  );

  return (
    <Grid container spacing={3}>
      {/* Overview Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Total Leads"
          value={statistics.totalLeads}
          icon={PersonIcon}
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="New Leads This Month"
          value={statistics.newLeadsThisMonth}
          icon={TimelineIcon}
          trend={15} // Example trend value
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Conversion Rate"
          value={`${statistics.conversionRate}%`}
          icon={AssessmentIcon}
          trend={5} // Example trend value
          color="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <StatCard
          title="Average Lead Score"
          value={statistics.averageLeadScore.toFixed(1)}
          icon={MonetizationOnIcon}
          color="warning"
        />
      </Grid>

      {/* Distribution Charts */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Stage Distribution
          </Typography>
          <Stack spacing={2}>
            {statistics.stageDistribution.map((stage) => (
              <Box key={stage.stage}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">{stage.stage}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stage.count} ({stage.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stage.percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Source Distribution
          </Typography>
          <Stack spacing={2}>
            {statistics.sourceDistribution.map((source) => (
              <Box key={source.source}>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                >
                  <Typography variant="body2">{source.source}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {source.count} ({source.percentage.toFixed(1)}%)
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={source.percentage}
                  sx={{ height: 8, borderRadius: 4 }}
                  color="secondary"
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default LeadStatistics; 