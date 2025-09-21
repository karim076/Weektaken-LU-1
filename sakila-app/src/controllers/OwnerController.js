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
  index = (req, res) => {
    try {
      this.ownerService.getDashboardStats((error, result) => {
        if (error) {
          console.error('Admin dashboard error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van het dashboard'
          });
        }

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
  manageStaff = (req, res) => {
    try {
      this.ownerService.getStaffManagementOverview((error, result) => {
        if (error) {
          console.error('Staff management error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van personeelsbeheer'
          });
        }

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
  showCreateStaff = (req, res) => {
    try {
      this.ownerService.getAllStores((error, storesResult) => {
        if (error) {
          console.error('Show create staff error:', error);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van het formulier'
          });
        }
        
        res.render('admin/staff-create', {
          title: 'Nieuwe Medewerker Toevoegen',
          stores: storesResult.success ? storesResult.data : [],
          error: null,
          success: null
        });
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
  createStaff = (req, res) => {
    try {
      const { firstName, lastName, email, username, password, storeId } = req.body;

      // Validation (NF-02: No code duplication)
      if (!firstName || !lastName || !email || !username || !password || !storeId) {
        this.ownerService.getAllStores((storeError, storesResult) => {
          if (storeError) {
            console.error('Create staff error:', storeError);
            return res.render('admin/staff-create', {
              title: 'Nieuwe Medewerker Toevoegen',
              stores: [],
              error: 'Er is een fout opgetreden bij het laden van winkels',
              success: null
            });
          }
          
          res.render('admin/staff-create', {
            title: 'Nieuwe Medewerker Toevoegen',
            stores: storesResult.success ? storesResult.data : [],
            error: 'Alle velden zijn verplicht',
            success: null
          });
        });
        return;
      }

      this.ownerService.createStaff({
        firstName,
        lastName,
        email,
        username,
        password,
        storeId
      }, (createError, result) => {
        if (createError) {
          console.error('Create staff error:', createError);
          this.ownerService.getAllStores((storeError, storesResult) => {
            res.render('admin/staff-create', {
              title: 'Nieuwe Medewerker Toevoegen',
              stores: storeError ? [] : (storesResult.success ? storesResult.data : []),
              error: 'Er is een fout opgetreden bij het toevoegen van de medewerker',
              success: null
            });
          });
          return;
        }

        this.ownerService.getAllStores((storeError, storesResult) => {
          if (storeError) {
            console.error('Get stores error after create:', storeError);
            return res.render('admin/staff-create', {
              title: 'Nieuwe Medewerker Toevoegen',
              stores: [],
              error: result.success ? null : result.message,
              success: result.success ? 'Medewerker succesvol toegevoegd!' : null
            });
          }

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
        });
      });
    } catch (error) {
      console.error('Create staff error:', error);
      this.ownerService.getAllStores((storeError, storesResult) => {
        res.render('admin/staff-create', {
          title: 'Nieuwe Medewerker Toevoegen',
          stores: storeError ? [] : (storesResult.success ? storesResult.data : []),
          error: 'Er is een fout opgetreden bij het toevoegen van de medewerker',
          success: null
        });
      });
    }
  };

  /**
   * Show edit staff form
   */
  showEditStaff = (req, res) => {
    try {
      const staffId = req.params.id;
      
      this.ownerService.getStaffDetails(staffId, (staffError, staffResult) => {
        if (staffError) {
          console.error('Show edit staff error:', staffError);
          return res.status(500).render('error', {
            title: 'Server Fout',
            status: 500,
            message: 'Er is een fout opgetreden bij het laden van het formulier'
          });
        }

        if (!staffResult.success) {
          return res.status(404).render('error', {
            title: 'Medewerker Niet Gevonden',
            status: 404,
            message: staffResult.message
          });
        }

        this.ownerService.getAllStores((storeError, storesResult) => {
          if (storeError) {
            console.error('Get stores error in edit staff:', storeError);
            return res.render('admin/staff-edit', {
              title: `Medewerker Bewerken - ${staffResult.data.first_name} ${staffResult.data.last_name}`,
              staff: staffResult.data,
              stores: [],
              error: 'Kon winkels niet laden',
              success: null
            });
          }

          res.render('admin/staff-edit', {
            title: `Medewerker Bewerken - ${staffResult.data.first_name} ${staffResult.data.last_name}`,
            staff: staffResult.data,
            stores: storesResult.success ? storesResult.data : [],
            error: null,
            success: null
          });
        });
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
  updateStaff = (req, res) => {
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

      this.ownerService.updateStaff(staffId, updateData, (updateError, result) => {
        if (updateError) {
          console.error('Update staff error:', updateError);
          // Get staff details and stores for error rendering
          this.ownerService.getStaffDetails(staffId, (staffError, staffResult) => {
            this.ownerService.getAllStores((storesError, storesResult) => {
              res.render('admin/staff-edit', {
                title: 'Medewerker Bewerken',
                staff: staffResult?.data || {},
                stores: storesResult?.success ? storesResult.data : [],
                error: 'Er is een fout opgetreden bij het bijwerken van de medewerker',
                success: null
              });
            });
          });
          return;
        }

        // Get updated staff details and stores for rendering
        this.ownerService.getStaffDetails(staffId, (staffError, staffResult) => {
          if (staffError) {
            console.error('Staff details error:', staffError);
            return res.status(500).render('error', {
              title: 'Server Fout',
              status: 500,
              message: 'Er is een fout opgetreden bij het laden van medewerkergegevens'
            });
          }

          this.ownerService.getAllStores((storesError, storesResult) => {
            if (storesError) {
              console.error('Stores error:', storesError);
              return res.status(500).render('error', {
                title: 'Server Fout',
                status: 500,
                message: 'Er is een fout opgetreden bij het laden van winkelgegevens'
              });
            }

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
          });
        });
      });
    } catch (error) {
      console.error('Update staff error:', error);
      this.ownerService.getStaffDetails(req.params.id, (staffError, staffResult) => {
        this.ownerService.getAllStores((storesError, storesResult) => {
          res.render('admin/staff-edit', {
            title: 'Medewerker Bewerken',
            staff: staffResult?.data || {},
            stores: storesResult?.success ? storesResult.data : [],
            error: 'Er is een fout opgetreden bij het bijwerken van de medewerker',
            success: null
          });
        });
      });
    }
  };

  /**
   * Delete staff member (US3E5)
   */
  deleteStaff = (req, res) => {
    try {
      const staffId = req.params.id;

      this.ownerService.deleteStaff(staffId, (error, result) => {
        if (error) {
          console.error('Delete staff error:', error);
          return res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het verwijderen van de medewerker'
          });
        }

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
  assignStaffToStore = (req, res) => {
    try {
      const { staffId, storeId } = req.body;
      const assignedBy = req.user.id; // Owner ID from auth middleware

      this.ownerService.assignStaffToStore(staffId, storeId, assignedBy, (error, result) => {
        if (error) {
          console.error('Assign staff to store error:', error);
          return res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het toewijzen van de medewerker'
          });
        }

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
  removeStaffFromStore = (req, res) => {
    try {
      const { staffId, storeId } = req.body;

      this.ownerService.removeStaffFromStore(staffId, storeId, (error, result) => {
        if (error) {
          console.error('Remove staff from store error:', error);
          return res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het verwijderen van de medewerker'
          });
        }

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
  getStoreStaff = (req, res) => {
    try {
      const storeId = req.params.storeId;

      this.ownerService.getStoreStaffAssignments(storeId, (error, result) => {
        if (error) {
          console.error('Get store staff error:', error);
          return res.status(500).json({
            success: false,
            message: 'Er is een fout opgetreden bij het ophalen van winkelpersoneel'
          });
        }

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
