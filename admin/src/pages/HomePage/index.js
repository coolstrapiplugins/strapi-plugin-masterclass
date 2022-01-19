
/*
 *
 * HomePage
 *
 */

import React, { memo, useState, useEffect } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Typography } from '@strapi/design-system/Typography'
import { Tabs, Tab, TabGroup, TabPanels, TabPanel } from '@strapi/design-system/Tabs'
import { Courses, Lectures } from "../../components/Tabs"

const HomePage = () => {
  return (
    <Box background="neutral100" padding={8}>
      <Box paddingBottom={3} paddingTop={3}>
        <Typography variant="alpha" fontWeight="bold">Masterclass: learning management system</Typography>
      </Box>
      <TabGroup label="Some stuff for the label" id="tabs">
        <Tabs>
          <Tab>Courses</Tab>
          <Tab>Lectures</Tab>
        </Tabs>
        <TabPanels>
          <TabPanel>
            <Courses />
          </TabPanel>
          <TabPanel>
            <Lectures />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </Box>
  )
};

export default memo(HomePage);

