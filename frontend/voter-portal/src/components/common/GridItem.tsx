import React from 'react';
import { Grid, GridProps } from '@mui/material';

// This is a compatibility component to handle the differences between MUI v5 and v7 Grid APIs
interface GridItemProps {
  children: React.ReactNode;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  key?: string;
}

const GridItem: React.FC<GridItemProps> = ({ children, ...props }) => {
  return (
    <Grid {...props}>
      {children}
    </Grid>
  );
};

export default GridItem;
