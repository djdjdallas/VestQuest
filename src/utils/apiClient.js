"use client";

import { supabase } from "@/lib/supabase";

/**
 * A utility for making authenticated API requests
 * Automatically handles authentication tokens and refreshing
 */
export const apiClient = {
  /**
   * Make a GET request to the API
   * @param {string} url - The URL to request
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async get(url, options = {}) {
    return this.request(url, { method: "GET", ...options });
  },

  /**
   * Make a POST request to the API
   * @param {string} url - The URL to request
   * @param {Object} data - The data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  },

  /**
   * Make a PUT request to the API
   * @param {string} url - The URL to request
   * @param {Object} data - The data to send
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });
  },

  /**
   * Make a DELETE request to the API
   * @param {string} url - The URL to request
   * @param {Object} options - Additional fetch options
   * @returns {Promise<Object>} The response data
   */
  async delete(url, options = {}) {
    return this.request(url, { method: "DELETE", ...options });
  },

  /**
   * Make a request to the API with authentication
   * @param {string} url - The URL to request
   * @param {Object} options - Fetch options
   * @returns {Promise<Object>} The response data
   */
  async request(url, options = {}) {
    try {
      // Get the current session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error("Not authenticated");
      }

      // Add the authorization header
      const headers = {
        Authorization: `Bearer ${accessToken}`,
        ...options.headers,
      };

      // Make the request
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // Handle unauthorized errors (expired token)
      if (response.status === 401) {
        // Try to refresh the token
        const { data: refreshData, error: refreshError } =
          await supabase.auth.refreshSession();

        if (refreshError || !refreshData.session) {
          // Redirect to login if refresh fails
          window.location.href = "/login";
          throw new Error("Session expired");
        }

        // Retry the request with the new token
        return this.request(url, options);
      }

      // Parse the response
      const contentType = response.headers.get("content-type");
      let data;

      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      // Handle errors
      if (!response.ok) {
        throw new Error(typeof data === "string" ? data : JSON.stringify(data));
      }

      return data;
    } catch (error) {
      console.error("API request error:", error);
      throw error;
    }
  },
};
