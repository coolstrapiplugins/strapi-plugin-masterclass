/*
 *
 * View and create lectures
 *
 */

import React, { memo, useState } from 'react';
// import PropTypes from 'prop-types';
import { Box } from "@strapi/design-system/Box"
import { Typography } from '@strapi/design-system/Typography'
import pluginId from '../../pluginId';
import axios from '../../utils/axiosInstance';

const Lectures = () => {
  const [video, setVideo] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    setVideo(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault()
    const metadata = {
      name: "introduction to termodinamics"
    }
    const formData = new FormData();
    formData.append("video", video, video.name);
    formData.append("data", JSON.stringify(metadata));

    const url = "/masterclass/upload"
    axios.post(url, formData)
    .then(() => {
      // Handle success.
      console.log("sent")
    })
    .catch(error => {
      // Handle error.
      console.log(error);
    });
  }

  return (
    <Box background="neutral0" padding={4}>
      <Typography variant="beta">
        Lectures
      </Typography>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={handleFile} />
        <Box>
          <button type="submit">send</button>
        </Box>
      </form>
    </Box>
  );
};

export default memo(Lectures);
