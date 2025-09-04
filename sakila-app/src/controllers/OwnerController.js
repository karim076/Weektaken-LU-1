const OwnerService = require('../services/OwnerService');

/**
 * Controller for owner/admin operations using service layer
 */
class OwnerController {
  constructor() {
    this.ownerService = new OwnerService();
  }

  /**
   * Admin dashboard (Epic 5 & 6)
   */
  index = async (req, res) => {
    try {
      const result = await this.ownerService.getDashboardStats();

      if (!result.success) {
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: result.message
        });
      }

      res.render('admin/dashboard', {
        title: 'Admin Dashboard - Sakila',
        stats: result.data
      });
    } catch (error) {
      console.error('Admin dashboard error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het dashboard'
      });
    }
  };

  /**
   * Staff management overview (US2E5)
   */
  manageStaff = async (req, res) => {
    try {
      const result = await this.ownerService.getStaffManagementOverview();

      if (!result.success) {
        return res.status(500).render('error', {
          title: 'Server Fout',
          status: 500,
          message: result.message
        });
      }

      res.render('admin/staff-management', {
        title: 'Personeelsbeheer - Admin',
        staff: result.data.staff,
        stores: result.data.stores
      });
    } catch (error) {
      console.error('Staff management error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van personeelsbeheer'
      });
    }
  };

  /**
   * Show create staff form (US1E5)
   */
  showCreateStaff = async (req, res) => {
    try {
      const storesResult = await this.ownerService.getAllStores();
      
      res.render('admin/staff-create', {
        title: 'Nieuwe Medewerker Toevoegen',
        stores: storesResult.success ? storesResult.data : [],
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Show create staff error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het formulier'
      });
    }
  };

  /**
   * Create new staff member (US1E5)
   */
  createStaff = async (req, res) => {
    try {
      const { firstName, lastName, email, username, password, storeId } = req.body;

      // Validation (NF-02: No code duplication)
      if (!firstName || !lastName || !email || !username || !password || !storeId) {
        const storesResult = await this.ownerService.getAllStores();
        return res.render('admin/staff-create', {
          title: 'Nieuwe Medewerker Toevoegen',
          stores: storesResult.success ? storesResult.data : [],
          error: 'Alle velden zijn verplicht',
          success: null
        });
      }

      const result = await this.ownerService.createStaff({
        firstName,
        lastName,
        email,
        username,
        password,
        storeId
      });

      const storesResult = await this.ownerService.getAllStores();

      if (!result.success) {
        return res.render('admin/staff-create', {
          title: 'Nieuwe Medewerker Toevoegen',
          stores: storesResult.success ? storesResult.data : [],
          error: result.message,
          success: null
        });
      }

      res.render('admin/staff-create', {
        title: 'Nieuwe Medewerker Toevoegen',
        stores: storesResult.success ? storesResult.data : [],
        error: null,
        success: 'Medewerker succesvol toegevoegd!'
      });
    } catch (error) {
      console.error('Create staff error:', error);
      const storesResult = await this.ownerService.getAllStores();
      res.render('admin/staff-create', {
        title: 'Nieuwe Medewerker Toevoegen',
        stores: storesResult.success ? storesResult.data : [],
        error: 'Er is een fout opgetreden bij het toevoegen van de medewerker',
        success: null
      });
    }
  };

  /**
   * Show edit staff form
   */
  showEditStaff = async (req, res) => {
    try {
      const staffId = req.params.id;
      
      const [staffResult, storesResult] = await Promise.all([
        this.ownerService.getStaffDetails(staffId),
        this.ownerService.getAllStores()
      ]);

      if (!staffResult.success) {
        return res.status(404).render('error', {
          title: 'Medewerker Niet Gevonden',
          status: 404,
          message: staffResult.message
        });
      }

      res.render('admin/staff-edit', {
        title: `Medewerker Bewerken - ${staffResult.data.first_name} ${staffResult.data.last_name}`,
        staff: staffResult.data,
        stores: storesResult.success ? storesResult.data : [],
        error: null,
        success: null
      });
    } catch (error) {
      console.error('Show edit staff error:', error);
      res.status(500).render('error', {
        title: 'Server Fout',
        status: 500,
        message: 'Er is een fout opgetreden bij het laden van het formulier'
      });
    }
  };

  /**
   * Update staff member
   */
  updateStaff = async (req, res) => {
    try {
      const staffId = req.params.id;
      const { firstName, lastName, email, username, password, storeId, active } = req.body;

      const updateData = {
        firstName,
        lastName,
        email,
        username,
        storeId,
        active: active === 'on'
      };

      // Only update password if provided
      if (password && password.trim() !== '') {
        updateData.password = password;
      }

      const result = await this.ownerService.updateStaff(staffId, updateData);

      const [staffResult, storesResult] = await Promise.all([
        this.ownerService.getStaffDetails(staffId),
        this.ownerService.getAllStores()
      ]);

      if (!result.success) {
        return res.render('admin/staff-edit', {
          title: 'Medewerker Bewerken',
          staff: staffResult.data || {},
          stores: storesResult.success ? storesResult.data : [],
          error: result.message,
          success: null
        });
      }

      res.render('admin/staff-edit', {
        title: 'Medewerker Bewerken',
        staff: staffResult.data,
        stores: storesResult.success ? storesResult.data : [],
        error: null,
        success: 'Medewerker succesvol bijgewerkt!'
      });
    } catch (error) {
      console.error('Update staff error:', error);
      const [staffResult, storesResult] = await Promise.all([
        this.ownerService.getStaffDetails(req.params.id),
        this.ownerService.getAllStores()
      ]);
      
      res.render('admin/staff-edit', {
        title: 'Medewerker Bewerken',
        staff: staffResult.data || {},
        stores: storesResult.success ? storesResult.data : [],
        error: 'Er is een fout opgetreden bij het bijwerken van de medewerker',
        success: null
      });
    }
  };

  /**
   * Delete staff member (US3E5)
   */
  deleteStaff = async (req, res) => {
    try {
      const staffId = req.params.id;

      const result = await this.ownerService.deleteStaff(staffId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Delete staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verwijderen van de medewerker'
      });
    }
  };

  /**
   * Assign staff to store
   */
  assignStaffToStore = async (req, res) => {
    try {
      const { staffId, storeId } = req.body;
      const assignedBy = req.user.id; // Owner ID from auth middleware

      const result = await this.ownerService.assignStaffToStore(staffId, storeId, assignedBy);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Assign staff to store error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het toewijzen van de medewerker'
      });
    }
  };

  /**
   * Remove staff from store
   */
  removeStaffFromStore = async (req, res) => {
    try {
      const { staffId, storeId } = req.body;

      const result = await this.ownerService.removeStaffFromStore(staffId, storeId);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Remove staff from store error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het verwijderen van de medewerker'
      });
    }
  };

  /**
   * Get store staff assignments
   */
  getStoreStaff = async (req, res) => {
    try {
      const storeId = req.params.storeId;

      const result = await this.ownerService.getStoreStaffAssignments(storeId);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          message: result.message
        });
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Get store staff error:', error);
      res.status(500).json({
        success: false,
        message: 'Er is een fout opgetreden bij het ophalen van winkelpersoneel'
      });
    }
  };
}

module.exports = OwnerController;
