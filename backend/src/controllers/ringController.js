const RingModel = require('../models/RingModel');

class RingController {
  // Get all rings
  async getAllRings(req, res) {
    try {
      const {
        material, minPrice, maxPrice, status, search,
        page, limit
      } = req.query;

      const filters = { material, minPrice, maxPrice, status, search };
      const pagination = { page, limit };

      const result = await RingModel.findAll(filters, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get all rings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch rings',
        error: error.message
      });
    }
  }

  // Get single ring
  async getRingById(req, res) {
    try {
      const { id } = req.params;
      const ring = await RingModel.findById(parseInt(id));

      if (!ring) {
        return res.status(404).json({
          success: false,
          message: 'Ring not found'
        });
      }

      res.json({
        success: true,
        data: ring
      });
    } catch (error) {
      console.error('Get ring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ring',
        error: error.message
      });
    }
  }

  // Get ring by identifier
  async getRingByIdentifier(req, res) {
    try {
      const { identifier } = req.params;
      const ring = await RingModel.findByIdentifier(identifier);

      if (!ring) {
        return res.status(404).json({
          success: false,
          message: 'Ring not found'
        });
      }

      res.json({
        success: true,
        data: ring
      });
    } catch (error) {
      console.error('Get ring by identifier error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch ring',
        error: error.message
      });
    }
  }

  // Create ring
  async createRing(req, res) {
    try {
      const { ring_name, material, price, ...rest } = req.body;

      if (!ring_name || !material || !price) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: ring_name, material, price'
        });
      }

      const newRing = await RingModel.create({ ring_name, material, price, ...rest });

      res.status(201).json({
        success: true,
        message: 'Ring created successfully',
        data: newRing
      });
    } catch (error) {
      console.error('Create ring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create ring',
        error: error.message
      });
    }
  }

  // Update ring
  async updateRing(req, res) {
    try {
      const { id } = req.params;
      
      const existingRing = await RingModel.findById(parseInt(id));
      if (!existingRing) {
        return res.status(404).json({
          success: false,
          message: 'Ring not found'
        });
      }

      const updatedRing = await RingModel.update(parseInt(id), req.body);

      res.json({
        success: true,
        message: 'Ring updated successfully',
        data: updatedRing
      });
    } catch (error) {
      console.error('Update ring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update ring',
        error: error.message
      });
    }
  }

  // Delete ring
  async deleteRing(req, res) {
    try {
      const { id } = req.params;
      
      const deleted = await RingModel.delete(parseInt(id));

      if (!deleted) {
        return res.status(404).json({
          success: false,
          message: 'Ring not found'
        });
      }

      res.json({
        success: true,
        message: 'Ring deleted successfully'
      });
    } catch (error) {
      console.error('Delete ring error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete ring',
        error: error.message
      });
    }
  }

  // Get shop rings
  async getShopRings(req, res) {
    try {
      const { minPrice, maxPrice, material, page, limit } = req.query;

      const filters = { minPrice, maxPrice, material };
      const pagination = { page, limit };

      const result = await RingModel.getShopRings(filters, pagination);

      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (error) {
      console.error('Get shop rings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shop rings',
        error: error.message
      });
    }
  }

  // Get filter options
  async getFilterOptions(req, res) {
    try {
      const options = await RingModel.getFilterOptions();

      res.json({
        success: true,
        data: options
      });
    } catch (error) {
      console.error('Get filter options error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch filter options',
        error: error.message
      });
    }
  }
}

module.exports = new RingController();