import axiosInstance from '../utils/axiosInstance';

export const areaService = {
  // Areas CRUD
  getAllAreas: async () => {
    const response = await axiosInstance.get('/areas');
    return response.data;
  },

  createArea: async (areaData) => {
    const response = await axiosInstance.post('/areas', areaData);
    return response.data;
  },

  updateArea: async (areaId, areaData) => {
    const response = await axiosInstance.put(`/areas/${areaId}`, areaData);
    return response.data;
  },

  deleteArea: async (areaId) => {
    const response = await axiosInstance.delete(`/areas/${areaId}`);
    return response.data;
  },

  // Sub-areas CRUD
  getSubAreas: async (areaId) => {
    const response = await axiosInstance.get(`/areas/subareas?area_id=${areaId}`);
    return response.data;
  },

  createSubArea: async (areaId, address) => {
    const response = await axiosInstance.post('/areas/subareas', {
      area_id: areaId,
      address: address
    });
    return response.data;
  },

  updateSubArea: async (areaId, subAreaId, address) => {
    const response = await axiosInstance.put('/areas/subareas', {
      area_id: areaId,
      subarea_id: subAreaId,
      address: address
    });
    return response.data;
  },

  deleteSubArea: async (areaId, subAreaId) => {
    const response = await axiosInstance.delete('/areas/subareas', {
      data: {
        area_id: areaId,
        subarea_id: subAreaId
      }
    });
    return response.data;
  }
};
