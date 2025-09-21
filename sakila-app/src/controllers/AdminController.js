const CustomerService = require('../services/CustomerService');
const FilmService = require('../services/FilmService');

/**
 * Admin Controller for staff and customer management
 */
class AdminController {
  constructor() {
    this.customerService = new CustomerService();
    this.filmService = new FilmService();
  }

  /**
   * Admin Dashboard
   */
  dashboard(req, res) {
    // Get statistics for dashboard
    this.customerService.getTotalCustomers((error, totalCustomers) => {
      if (error) {
        console.error('Admin dashboard customers error:', error);
        return res.status(500).render('error', {
          title: 'Server Error',
          status: 500,
          message: 'An error occurred while loading customer statistics'
        });
      }

      this.filmService.getTotalFilms((error, totalFilms) => {
        if (error) {
          console.error('Admin dashboard films error:', error);
          return res.status(500).render('error', {
            title: 'Server Error',
            status: 500,
            message: 'An error occurred while loading film statistics'
          });
        }

        this.getStaffCount((error, totalStaff) => {
          if (error) {
            console.error('Admin dashboard staff error:', error);
            return res.status(500).render('error', {
              title: 'Server Error',
              status: 500,
              message: 'An error occurred while loading staff statistics'
            });
          }

          this.getStoreCount((error, totalStores) => {
            if (error) {
              console.error('Admin dashboard stores error:', error);
              return res.status(500).render('error', {
                title: 'Server Error',
                status: 500,
                message: 'An error occurred while loading store statistics'
              });
            }

            const stats = {
              totalCustomers,
              totalFilms,
              totalStaff,
              totalStores
            };

            res.render('admin/dashboard', {
              title: 'Admin Dashboard - Sakila',
              user: req.user,
              stats
            });
          });
        });
      });
    });
  }

  /**
   * Staff Management Page
   */
  staffManagement(req, res) {
    this.getAllStaff((staffError, staff) => {
      if (staffError) {
        console.error('Staff management error (staff):', staffError);
        return res.status(500).render('error', {
          title: 'Server Error',
          status: 500,
          message: 'An error occurred while loading staff management'
        });
      }

      this.getAllStores((storeError, stores) => {
        if (storeError) {
          console.error('Staff management error (stores):', storeError);
          return res.status(500).render('error', {
            title: 'Server Error',
            status: 500,
            message: 'An error occurred while loading staff management'
          });
        }

        res.render('admin/staff', {
          title: 'Staff Management - Sakila',
          user: req.user,
          staff,
          stores
        });
      });
    });
  }

  /**
   * Customer Management Page
   */
  customerManagement(req, res) {
    this.customerService.getAllCustomers((customerError, customers) => {
      if (customerError) {
        console.error('Customer management error (customers):', customerError);
        return res.status(500).render('error', {
          title: 'Server Error',
          status: 500,
          message: 'An error occurred while loading customer management'
        });
      }

      this.getAllStores((storeError, stores) => {
        if (storeError) {
          console.error('Customer management error (stores):', storeError);
          return res.status(500).render('error', {
            title: 'Server Error',
            status: 500,
            message: 'An error occurred while loading customer management'
          });
        }

        res.render('admin/customers', {
          title: 'Customer Management - Sakila',
          user: req.user,
          customers,
          stores
        });
      });
    });
  }
}

module.exports = AdminController;
