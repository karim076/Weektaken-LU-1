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
  async staffManagement(req, res) {
    try {
      const staff = await this.getAllStaff();
      const stores = await this.getAllStores();

      res.render('admin/staff', {
        title: 'Staff Management - Sakila',
        user: req.user,
        staff,
        stores
      });
    } catch (error) {
      console.error('Staff management error:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        status: 500,
        message: 'An error occurred while loading staff management'
      });
    }
  }

  /**
   * Customer Management Page
   */
  async customerManagement(req, res) {
    try {
      const customers = await this.customerService.getAllCustomers();
      const stores = await this.getAllStores();

      res.render('admin/customers', {
        title: 'Customer Management - Sakila',
        user: req.user,
        customers,
        stores
      });
    } catch (error) {
      console.error('Customer management error:', error);
      res.status(500).render('error', {
        title: 'Server Error',
        status: 500,
        message: 'An error occurred while loading customer management'
      });
    }
  }

  // Helper methods
  async getAllStaff() {
    const db = require('../../db');
    const [rows] = await db.promise().query(`
      SELECT s.*, st.store_id, a.address, c.city, co.country 
      FROM staff s
      LEFT JOIN store st ON s.store_id = st.store_id
      LEFT JOIN address a ON st.address_id = a.address_id
      LEFT JOIN city c ON a.city_id = c.city_id
      LEFT JOIN country co ON c.country_id = co.country_id
      ORDER BY s.staff_id
    `);
    return rows;
  }

  async getAllStores() {
    const db = require('../../db');
    const [rows] = await db.promise().query(`
      SELECT st.*, a.address, c.city, co.country
      FROM store st
      LEFT JOIN address a ON st.address_id = a.address_id
      LEFT JOIN city c ON a.city_id = c.city_id
      LEFT JOIN country co ON c.country_id = co.country_id
      ORDER BY st.store_id
    `);
    return rows;
  }

  async getStaffCount() {
    const db = require('../../db');
    const [rows] = await db.promise().query('SELECT COUNT(*) as count FROM staff WHERE active = 1');
    return rows[0].count;
  }

  async getStoreCount() {
    const db = require('../../db');
    const [rows] = await db.promise().query('SELECT COUNT(*) as count FROM store');
    return rows[0].count;
  }
}

module.exports = AdminController;
