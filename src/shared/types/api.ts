

export interface paths {
    "/api/v1/admin/users": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_users_api_v1_admin_users_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/batch-deactivate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_deactivate_users_api_v1_admin_users_batch_deactivate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/batch-activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_activate_users_api_v1_admin_users_batch_activate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_user_api_v1_admin_users__user_id__get"];
        put?: never;
        post?: never;
        delete: operations["delete_user_api_v1_admin_users__user_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{user_id}/activate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["activate_user_api_v1_admin_users__user_id__activate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{user_id}/grant-admin": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["grant_admin_permissions_api_v1_admin_users__user_id__grant_admin_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/users/{user_id}/permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["change_user_permissions_api_v1_admin_users__user_id__permissions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/me/reset-permissions": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reset_my_permissions_api_v1_admin_me_reset_permissions_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_restaurants_api_v1_admin_restaurants_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants/batch-approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_approve_restaurants_api_v1_admin_restaurants_batch_approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants/batch-reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_reject_restaurants_api_v1_admin_restaurants_batch_reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_restaurant_api_v1_admin_restaurants__restaurant_id__get"];
        put?: never;
        post?: never;
        delete: operations["delete_restaurant_api_v1_admin_restaurants__restaurant_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants/{restaurant_id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["approve_restaurant_api_v1_admin_restaurants__restaurant_id__approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/restaurants/{restaurant_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reject_restaurant_api_v1_admin_restaurants__restaurant_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_vendors_api_v1_admin_vendors_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors/batch-approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_approve_vendors_api_v1_admin_vendors_batch_approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors/batch-reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["batch_reject_vendors_api_v1_admin_vendors_batch_reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors/{vendor_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_vendor_api_v1_admin_vendors__vendor_id__get"];
        put?: never;
        post?: never;
        delete: operations["delete_vendor_api_v1_admin_vendors__vendor_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors/{vendor_id}/approve": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["approve_vendor_api_v1_admin_vendors__vendor_id__approve_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/vendors/{vendor_id}/reject": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["reject_vendor_api_v1_admin_vendors__vendor_id__reject_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_reviews_api_v1_admin_reviews_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/reviews/batch": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["batch_delete_reviews_api_v1_admin_reviews_batch_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/reviews/{review_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_review_api_v1_admin_reviews__review_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_orders_api_v1_admin_orders_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/stats": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_platform_stats_api_v1_admin_stats_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/finance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_finance_api_v1_admin_finance_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/analytics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_advanced_analytics_api_v1_admin_analytics_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/audit-logs": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_audit_logs_api_v1_admin_audit_logs_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/users.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_users_csv_api_v1_admin_export_users_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/orders.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_orders_csv_api_v1_admin_export_orders_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/restaurants.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_restaurants_csv_api_v1_admin_export_restaurants_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/vendors.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_vendors_csv_api_v1_admin_export_vendors_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/reviews.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_reviews_csv_api_v1_admin_export_reviews_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/finance.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_finance_pdf_api_v1_admin_export_finance_pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/analytics.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_analytics_pdf_api_v1_admin_export_analytics_pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/admin/export/overview.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_overview_pdf_api_v1_admin_export_overview_pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/advisor/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["advisor_chat_api_v1_ai_advisor_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/advisor/insights": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["advisor_insights_api_v1_ai_advisor_insights_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/ai/order/chat": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["order_chat_api_v1_ai_order_chat_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/cart": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_cart_api_v1_cart_get"];
        put?: never;
        post: operations["update_cart_api_v1_cart_post"];
        delete: operations["clear_cart_api_v1_cart_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/promos": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["list_promos_api_v1_promos_get"];
        put?: never;
        post: operations["create_promo_api_v1_promos_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/promos/{code}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["deactivate_promo_api_v1_promos__code__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/promos/validate": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["validate_promo_api_v1_promos_validate_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_registration_api_v1_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/login": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_login_api_v1_login_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/refresh": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_refresh_api_v1_refresh_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_logout_api_v1_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_my_favorites_api_v1_favorites_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/favorites/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["add_favorite_api_v1_favorites__restaurant_id__post"];
        delete: operations["remove_favorite_api_v1_favorites__restaurant_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_my_staff_profile_api_v1_staff_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/my-application": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_my_application_api_v1_staff_my_application_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/requests/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_staff_request_api_v1_staff_requests__restaurant_id__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/requests/{request_id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["update_staff_status_api_v1_staff_requests__request_id__status_patch"];
        trace?: never;
    };
    "/api/v1/staff/my-requests": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_vendor_requests_api_v1_staff_my_requests_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/my-members": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_vendor_members_api_v1_staff_my_members_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/members/{profile_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["remove_staff_member_api_v1_staff_members__profile_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/staff/menu/{restaurant_id}/items/{item_id}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["staff_toggle_item_availability_api_v1_staff_menu__restaurant_id__items__item_id__availability_patch"];
        trace?: never;
    };
    "/api/v1/vendors/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_my_vendor_profile_api_v1_vendors__get"];
        put?: never;
        post: operations["create_vendor_api_v1_vendors__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/finance": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_vendor_finance_api_v1_vendors_finance_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/analytics": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_vendor_analytics_api_v1_vendors_analytics_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/export/orders.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_orders_csv_api_v1_vendors_export_orders_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/export/menu.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_menu_csv_api_v1_vendors_export_menu_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/export/promos.csv": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_promos_csv_api_v1_vendors_export_promos_csv_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/export/finance.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_finance_pdf_api_v1_vendors_export_finance_pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/vendors/export/analytics.pdf": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["export_analytics_pdf_api_v1_vendors_export_analytics_pdf_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/public/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_public_restaurant_api_v1_restaurants_public__restaurant_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/public": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_public_restaurants_api_v1_restaurants_public_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_my_restaurants_api_v1_restaurants__get"];
        put?: never;
        post: operations["create_restaurant_api_v1_restaurants__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["update_restaurant_api_v1_restaurants__restaurant_id__patch"];
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/photo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["upload_restaurant_photo_api_v1_restaurants__restaurant_id__photo_post"];
        delete: operations["delete_restaurant_photo_api_v1_restaurants__restaurant_id__photo_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/working-hours": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_working_hours_api_v1_restaurants__restaurant_id__working_hours_get"];
        put: operations["set_working_hours_endpoint_api_v1_restaurants__restaurant_id__working_hours_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/media/{key}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_media_api_v1_media__key__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_menu_item_api_v1_menu__restaurant_id__items_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_menu_item_api_v1_menu__restaurant_id__items__item_id__delete"];
        options?: never;
        head?: never;
        patch: operations["update_menu_item_api_v1_menu__restaurant_id__items__item_id__patch"];
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/photo": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["upload_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_post"];
        delete: operations["delete_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/availability": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["toggle_item_availability_api_v1_menu__restaurant_id__items__item_id__availability_patch"];
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__delete"];
        options?: never;
        head?: never;
        patch: operations["update_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__patch"];
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}/items/{item_id}/option-groups/{group_id}/options/{option_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options__option_id__delete"];
        options?: never;
        head?: never;
        patch: operations["update_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options__option_id__patch"];
        trace?: never;
    };
    "/api/v1/menu/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_restaurant_menu_api_v1_menu__restaurant_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["create_order_api_v1_orders__post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/estimate/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_order_load_estimate_api_v1_orders_estimate__restaurant_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_my_orders_api_v1_orders_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/restaurant/{restaurant_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_restaurant_orders_api_v1_orders_restaurant__restaurant_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{order_id}/status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["update_order_status_api_v1_orders__order_id__status_patch"];
        trace?: never;
    };
    "/api/v1/orders/{order_id}/events": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_order_events_api_v1_orders__order_id__events_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{order_id}/cancel": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["cancel_order_api_v1_orders__order_id__cancel_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{order_id}/complete": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["complete_order_api_v1_orders__order_id__complete_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/orders/{order_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_order_api_v1_orders__order_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/reviews": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_reviews_api_v1_restaurants__restaurant_id__reviews_get"];
        put?: never;
        post: operations["create_review_api_v1_restaurants__restaurant_id__reviews_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/reviews/{review_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_my_review_api_v1_restaurants__restaurant_id__reviews__review_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/reviews/my": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put: operations["update_my_review_api_v1_restaurants__restaurant_id__reviews_my_put"];
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/restaurants/{restaurant_id}/rating": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_rating_api_v1_restaurants__restaurant_id__rating_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/check": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_check_api_v1_telegram_check_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_register_api_v1_telegram_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/auth": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_auth_api_v1_telegram_auth_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/site-login/request-code": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_site_login_request_code_api_v1_telegram_site_login_request_code_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/site-login/request-code-by-username": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_site_login_request_code_by_username_api_v1_telegram_site_login_request_code_by_username_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/site-login/verify": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_site_login_verify_api_v1_telegram_site_login_verify_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/site-login/verify-by-username": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_site_login_verify_by_username_api_v1_telegram_site_login_verify_by_username_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/site-login/password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_site_login_set_password_api_v1_telegram_site_login_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/logout": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_logout_api_v1_telegram_logout_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/bot/register": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_bot_register_api_v1_telegram_bot_register_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/bot/link-phone": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_bot_link_phone_api_v1_telegram_bot_link_phone_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/bot/vendor-status": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_bot_vendor_status_api_v1_telegram_bot_vendor_status_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/telegram/bot/orders": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["telegram_bot_orders_api_v1_telegram_bot_orders_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/me": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_my_profile_api_v1_users_me_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch: operations["update_my_profile_api_v1_users_me_patch"];
        trace?: never;
    };
    "/api/v1/users/me/change-password": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["change_my_password_api_v1_users_me_change_password_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/users/{user_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["read_user_api_v1_users__user_id__get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["get_my_notifications_api_v1_notifications_get"];
        put?: never;
        post?: never;
        delete: operations["delete_all_notifications_api_v1_notifications_delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/{notification_id}/read": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["read_notification_api_v1_notifications__notification_id__read_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/read-all": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post: operations["read_all_notifications_api_v1_notifications_read_all_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/v1/notifications/{notification_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        post?: never;
        delete: operations["delete_notification_api_v1_notifications__notification_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/ping": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["ping_api_ping_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/health": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get: operations["health_api_health_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
}
export type webhooks = Record<string, never>;
export interface components {
    schemas: {
        AdminRestaurantResponse: {

            id: string;
            display_id?: string | null;
            name: string;
            address: string;

            vendor_id: string;
            vendor_name?: string | null;
            vendor_phone?: string | null;
            is_hiring: boolean;
            is_open: boolean;
            is_active: boolean;
            photo_url?: string | null;

            average_rating: number;

            review_count: number;

            orders_count: number;

            moderation_status: string;
            rejection_reason?: string | null;

            created_at: string;
        };
        AdminReviewResponse: {

            id: string;

            user_id: string;
            user_name?: string | null;
            user_phone?: string | null;

            restaurant_id: string;
            restaurant_name?: string | null;
            rating: number;
            text?: string | null;

            is_verified_purchase: boolean;

            created_at: string;
        };
        AdminUserResponse: {

            id: string;
            name?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            email?: string | null;
            telegram_username?: string | null;
            phone_number: string;
            permissions: components["schemas"]["Permission"][];
            is_active: boolean;

            created_at: string;
        };
        AdminVendorResponse: {

            id: string;

            user_id: string;
            name?: string | null;
            phone_number?: string | null;

            restaurants_count: number;

            approval_status: string;
            rejection_reason?: string | null;

            created_at: string;
        };
        AdvancedAnalytics: {
            hourly_load: components["schemas"]["AnalyticsPoint"][];
            category_revenue: components["schemas"]["AnalyticsPoint"][];
            aov_dynamics: components["schemas"]["FinanceSeriesPoint"][];

            retention: components["schemas"]["CohortPoint"][];
        };
        AdvisorChatRequest: {
            messages: components["schemas"]["ChatMessageIn"][];
            restaurant_id?: string | null;
        };
        AdvisorInsightsResponse: {
            insights: string;
            cached: boolean;
        };
        AnalyticsPoint: {
            label: string;
            value: number;
        };
        AvailabilityUpdate: {
            is_available: boolean;
        };
        BatchIdsRequest: {
            ids: string[];
        };
        BatchRejectRequest: {
            ids: string[];
            reason?: string | null;
        };
        Body_upload_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_post: {

            file: string;
        };
        Body_upload_restaurant_photo_api_v1_restaurants__restaurant_id__photo_post: {

            file: string;
        };
        CartItemIn: {

            menu_item_id: string;
            name: string;
            price: number;
            image_url?: string | null;
            quantity: number;
            selected_option_ids?: string[];
            selected_options?: components["schemas"]["CartSelectedOption"][];
        };
        CartItemResponse: {
            menuItem: components["schemas"]["MenuItemShort"];
            quantity: number;

            selected_option_ids: string[];

            selected_options: components["schemas"]["CartSelectedOption"][];
        };
        CartResponse: {
            restaurant_id: string | null;
            items: components["schemas"]["CartItemResponse"][];
        };
        CartSelectedOption: {

            option_id: string;
            name: string;
            price_delta: number;
        };
        CartUpdate: {

            restaurant_id: string;
            items: components["schemas"]["CartItemIn"][];
        };

        Category: "SHAURMA" | "BURGER" | "PIZZA" | "SUSHI" | "SALAD" | "SNACK" | "DRINK" | "SOUP" | "DESSERT" | "OTHER";
        ChangePasswordRequest: {
            old_password: string;
            new_password: string;
        };
        ChatMessageIn: {

            role: "user" | "assistant";
            content: string;
        };
        CohortPoint: {
            cohort: string;
            day: number;
            retention: number;
        };
        FavoriteResponse: {

            id: string;
            restaurant: components["schemas"]["FavoriteRestaurantInfo"];

            created_at: string;
        };
        FavoriteRestaurantInfo: {

            id: string;
            name: string;
            address: string;
            is_open: boolean;
            is_hiring: boolean;
        };
        FinanceAnalytics: {
            revenue_by_day: components["schemas"]["FinanceSeriesPoint"][];
            average_check: number;
            top_restaurants: components["schemas"]["FinanceTopRestaurant"][];
            top_items: components["schemas"]["FinanceTopItem"][];
            cancelled_orders: number;
            total_orders: number;
            completed_orders: number;
            conversion_percent: number;

            total_revenue: number;
            revenue_growth_pct?: number | null;
        };
        FinanceSeriesPoint: {

            date: string;
            value: number;
        };
        FinanceTopItem: {

            menu_item_id: string;
            name: string;
            quantity: number;
            revenue: number;
        };
        FinanceTopRestaurant: {

            restaurant_id: string;
            name: string;
            revenue: number;
            orders_count: number;
        };
        HTTPValidationError: {
            detail?: components["schemas"]["ValidationError"][];
        };
        MenuItemCreate: {
            name: string;
            description?: string | null;
            price: number;
            category: components["schemas"]["Category"];

            prep_time_minutes: number;
        };
        MenuItemOptionCreate: {
            name: string;

            price_delta: number;

            sort_order: number;
        };
        MenuItemOptionGroupCreate: {
            name: string;

            selection_type: string;

            is_required: boolean;

            min_selected: number;
            max_selected?: number | null;

            sort_order: number;
            options?: components["schemas"]["MenuItemOptionCreate"][];
        };
        MenuItemOptionGroupResponse: {

            id: string;

            menu_item_id: string;
            name: string;
            selection_type: string;
            is_required: boolean;
            min_selected: number;
            max_selected?: number | null;
            sort_order: number;
            is_active: boolean;

            options: components["schemas"]["MenuItemOptionResponse"][];
        };
        MenuItemOptionGroupUpdate: {
            name?: string | null;
            selection_type?: string | null;
            is_required?: boolean | null;
            min_selected?: number | null;
            max_selected?: number | null;
            sort_order?: number | null;
            is_active?: boolean | null;
        };
        MenuItemOptionResponse: {

            id: string;

            group_id: string;
            name: string;
            price_delta: number;
            is_available: boolean;
            sort_order: number;
        };
        MenuItemOptionUpdate: {
            name?: string | null;
            price_delta?: number | null;
            is_available?: boolean | null;
            sort_order?: number | null;
        };
        MenuItemResponse: {

            id: string;
            name: string;
            description?: string | null;
            price: number;
            category: components["schemas"]["Category"];

            restaurant_id: string;
            is_available: boolean;
            prep_time_minutes: number;
            photo_url?: string | null;

            option_groups: components["schemas"]["MenuItemOptionGroupResponse"][];
        };
        MenuItemShort: {

            id: string;
            name: string;
            price: number;
            image_url?: string | null;
        };
        MenuItemUpdate: {
            name?: string | null;
            description?: string | null;
            price?: number | null;
            category?: components["schemas"]["Category"] | null;
            is_available?: boolean | null;
            prep_time_minutes?: number | null;
        };
        Meta: {

            timestamp?: string;
        };
        ModerationDecision: {
            reason?: string | null;
        };
        NotificationListResponse: {
            items: components["schemas"]["NotificationResponse"][];
            total: number;
            unread_count: number;
        };
        NotificationResponse: {

            id: string;

            user_id: string;
            title: string;
            message: string;
            type: components["schemas"]["NotificationType"];
            is_read: boolean;

            created_at: string;
        };

        NotificationType: "ORDER_STATUS" | "SYSTEM";
        OrderCancelRequest: {
            reason?: string | null;
        };
        OrderChatMessageIn: {

            role: "user" | "assistant";
            content: string;
        };
        OrderChatRequest: {
            messages: components["schemas"]["OrderChatMessageIn"][];
        };
        OrderCreate: {

            restaurant_id: string;
            items: components["schemas"]["OrderItemCreate"][];
            promo_code?: string | null;
            comment?: string | null;
            requested_pickup_at?: string | null;
        };
        OrderEventResponse: {

            id: string;

            order_id: string;

            actor_id: string;
            actor_permissions: components["schemas"]["Permission"][];
            old_status: components["schemas"]["OrderStatus"];
            new_status: components["schemas"]["OrderStatus"];

            created_at: string;
        };
        OrderItemCreate: {

            menu_item_id: string;

            quantity: number;
            selected_option_ids?: string[];
        };
        OrderItemOptionResponse: {

            id: string;
            option_id: string | null;
            name: string;
            price_delta: number;
        };
        OrderItemResponse: {

            id: string;

            menu_item_id: string;
            menu_item_name: string;
            menu_item_category: components["schemas"]["Category"];
            menu_item_prep_time: number;
            quantity: number;
            price_at_purchase: number;

            selected_options: components["schemas"]["OrderItemOptionResponse"][];
        };
        OrderLoadEstimate: {

            restaurant_id: string;
            ordering_available: boolean;
            reason?: string | null;
            active_orders_count: number;
            max_active_orders?: number | null;
            avg_prep_time_minutes: number;
            estimated_wait_min_minutes: number;
            estimated_wait_max_minutes: number;
            paused_until?: string | null;
        };
        OrderResponse: {

            id: string;
            display_id: number;

            user_id: string;
            customer_name?: string | null;
            customer_phone?: string | null;

            restaurant_id: string;
            restaurant_display_id?: string | null;
            restaurant_name?: string | null;
            restaurant_address?: string | null;
            status: components["schemas"]["OrderStatus"];
            total_price: number;
            comment?: string | null;
            cancellation_reason?: string | null;
            requested_pickup_at?: string | null;

            created_at: string;
            estimated_ready_at?: string | null;
            ready_at?: string | null;
            items: components["schemas"]["OrderItemResponse"][];
        };

        OrderStatus: "PENDING" | "ACCEPTED" | "READY" | "COMPLETED" | "CANCELLED";
        OrderStatusUpdate: {
            status: components["schemas"]["OrderStatus"];
            estimated_ready_in_minutes?: number | null;
            estimated_ready_at?: string | null;
        };
        Pagination: {
            current_page: number;
            per_page: number;
            total: number;
            total_pages: number;
            next: string | null;
            previous: string | null;
        };

        Permission: "admin.access" | "users.read" | "users.manage" | "users.assign_permissions" | "restaurants.read" | "restaurants.create" | "restaurants.update" | "restaurants.moderate" | "menu.read" | "menu.manage" | "cart.manage" | "favorites.manage" | "orders.create" | "orders.read_own" | "orders.read_restaurant" | "orders.manage_status" | "orders.moderate" | "reviews.create" | "reviews.read" | "reviews.moderate" | "promos.validate" | "promos.manage" | "vendors.create" | "vendors.read_own" | "vendors.analytics_read" | "vendors.moderate" | "staff.requests_create" | "staff.requests_manage" | "staff.members_manage" | "staff.profile_read" | "telegram.auth" | "display_board.view";
        PlatformStats: {
            users_by_permission: {
                [key: string]: number;
            };
            users_by_role: {
                [key: string]: number;
            };
            total_users: number;
            orders_by_status: {
                [key: string]: number;
            };
            total_restaurants: number;
            total_vendors: number;
            growth: {
                [key: string]: components["schemas"]["StatsGrowthPoint"][];
            };
        };
        PromoCreate: {
            code: string;

            discount_type: "PERCENT" | "FIXED";
            discount_value: number;

            restaurant_id: string;
            max_uses?: number | null;
            expires_at?: string | null;

            first_order_only: boolean;
            min_order_amount?: number | null;
            menu_category?: string | null;
        };
        PromoResponse: {

            id: string;
            code: string;
            discount_type: string;
            discount_value: number;

            restaurant_id: string;
            max_uses: number | null;
            used_count: number;
            expires_at: string | null;
            is_active: boolean;

            created_at: string;
            first_order_only: boolean;
            min_order_amount: number | null;
            menu_category: string | null;
        };
        PromoValidateRequest: {
            code: string;

            restaurant_id: string;
            order_total?: number | null;

            is_first_order: boolean;
        };
        PromoValidateResponse: {
            code: string;
            discount_type: string;
            discount_value: number;
            discounted_amount?: number | null;

            first_order_only: boolean;
            min_order_amount?: number | null;
        };
        RatingResponse: {

            restaurant_id: string;
            average_rating: number | null;
            review_count: number;
        };
        RestaurantCreate: {
            name: string;
            address: string;

            is_hiring: boolean;

            is_open: boolean;

            avg_prep_time_minutes: number;
            max_active_orders?: number | null;
        };
        RestaurantResponse: {

            id: string;
            display_id?: string | null;
            name: string;
            address: string;
            description?: string | null;

            vendor_id: string;

            is_hiring: boolean;

            is_open: boolean;

            is_ordering_paused: boolean;
            ordering_paused_until?: string | null;

            avg_prep_time_minutes: number;
            max_active_orders?: number | null;
            photo_url?: string | null;

            average_rating: number;

            review_count: number;

            orders_count_7d: number;

            moderation_status: string;
            rejection_reason?: string | null;
        };

        RestaurantSort: "default" | "rating" | "popularity_7d";
        RestaurantUpdate: {
            name?: string | null;
            address?: string | null;
            description?: string | null;
            is_hiring?: boolean | null;
            is_open?: boolean | null;
            is_ordering_paused?: boolean | null;
            ordering_paused_until?: string | null;
            avg_prep_time_minutes?: number | null;
            max_active_orders?: number | null;
            photo_url?: string | null;
        };
        ReviewCreate: {
            rating: number;
            text?: string | null;
        };
        ReviewResponse: {

            id: string;

            user_id: string;
            user_name?: string | null;

            restaurant_id: string;
            rating: number;
            text?: string | null;

            is_verified_purchase: boolean;

            created_at: string;
        };
        SetPermissionsRequest: {
            permissions: components["schemas"]["Permission"][];
        };

        SortDirection: "asc" | "desc";
        StaffMemberResponse: {

            id: string;

            user_id: string;

            restaurant_id: string;
            restaurant_name: string | null;
            role: string;
            user_name: string | null;
            user_phone: string | null;
        };
        StaffProfileResponse: {

            id: string;

            user_id: string;

            restaurant_id: string;
            role: string;
        };
        StaffRequestCreate: {
            message?: string | null;
        };
        StaffRequestResponse: {

            id: string;

            user_id: string;

            restaurant_id: string;
            message: string | null;
            status: components["schemas"]["StaffRequestStatus"];
        };

        StaffRequestStatus: "PENDING" | "ACCEPTED" | "REJECTED";
        StaffRequestStatusUpdate: {
            status: components["schemas"]["StaffRequestStatus"];
        };
        StatsGrowthPoint: {

            date: string;
            count: number;
        };
        SuccessListResponse_AdminRestaurantResponse_: {
            data: components["schemas"]["AdminRestaurantResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_AdminReviewResponse_: {
            data: components["schemas"]["AdminReviewResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_AdminUserResponse_: {
            data: components["schemas"]["AdminUserResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_AdminVendorResponse_: {
            data: components["schemas"]["AdminVendorResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_FavoriteResponse_: {
            data: components["schemas"]["FavoriteResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_MenuItemResponse_: {
            data: components["schemas"]["MenuItemResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_OrderEventResponse_: {
            data: components["schemas"]["OrderEventResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_OrderResponse_: {
            data: components["schemas"]["OrderResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_PromoResponse_: {
            data: components["schemas"]["PromoResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_RestaurantResponse_: {
            data: components["schemas"]["RestaurantResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_ReviewResponse_: {
            data: components["schemas"]["ReviewResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_StaffMemberResponse_: {
            data: components["schemas"]["StaffMemberResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_StaffRequestResponse_: {
            data: components["schemas"]["StaffRequestResponse"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessListResponse_TelegramBotOrderSummary_: {
            data: components["schemas"]["TelegramBotOrderSummary"][];
            pagination: components["schemas"]["Pagination"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdminRestaurantResponse_: {
            data: components["schemas"]["AdminRestaurantResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdminReviewResponse_: {
            data: components["schemas"]["AdminReviewResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdminUserResponse_: {
            data: components["schemas"]["AdminUserResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdminVendorResponse_: {
            data: components["schemas"]["AdminVendorResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdvancedAnalytics_: {
            data: components["schemas"]["AdvancedAnalytics"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_AdvisorInsightsResponse_: {
            data: components["schemas"]["AdvisorInsightsResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_CartResponse_: {
            data: components["schemas"]["CartResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_FavoriteResponse_: {
            data: components["schemas"]["FavoriteResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_FinanceAnalytics_: {
            data: components["schemas"]["FinanceAnalytics"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_MenuItemOptionGroupResponse_: {
            data: components["schemas"]["MenuItemOptionGroupResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_MenuItemOptionResponse_: {
            data: components["schemas"]["MenuItemOptionResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_MenuItemResponse_: {
            data: components["schemas"]["MenuItemResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_OrderLoadEstimate_: {
            data: components["schemas"]["OrderLoadEstimate"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_OrderResponse_: {
            data: components["schemas"]["OrderResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_PlatformStats_: {
            data: components["schemas"]["PlatformStats"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_PromoResponse_: {
            data: components["schemas"]["PromoResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_PromoValidateResponse_: {
            data: components["schemas"]["PromoValidateResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_RatingResponse_: {
            data: components["schemas"]["RatingResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_RestaurantResponse_: {
            data: components["schemas"]["RestaurantResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_ReviewResponse_: {
            data: components["schemas"]["ReviewResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_StaffProfileResponse_: {
            data: components["schemas"]["StaffProfileResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_StaffRequestResponse_: {
            data: components["schemas"]["StaffRequestResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_TelegramBotVendorStatusResponse_: {
            data: components["schemas"]["TelegramBotVendorStatusResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_TelegramCheckResponse_: {
            data: components["schemas"]["TelegramCheckResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_TelegramSiteLoginResponse_: {
            data: components["schemas"]["TelegramSiteLoginResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_TelegramSiteLoginStartResponse_: {
            data: components["schemas"]["TelegramSiteLoginStartResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_TokenResponse_: {
            data: components["schemas"]["TokenResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_UserPublicRead_: {
            data: components["schemas"]["UserPublicRead"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_UserRead_: {
            data: components["schemas"]["UserRead"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_VendorResponse_: {
            data: components["schemas"]["VendorResponse"];
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_dict_: {
            data: {
                [key: string]: unknown;
            };
            meta?: components["schemas"]["Meta"];
        };
        SuccessResponse_list_WorkingHoursRead__: {
            data: components["schemas"]["WorkingHoursRead"][];
            meta?: components["schemas"]["Meta"];
        };
        TelegramBotLinkRequest: {
            telegram_id: number;
            telegram_username?: string | null;
            phone_number: string;
            name: string;
        };
        TelegramBotOrderSummary: {
            id: string;
            display_id: number;
            status: string;
            restaurant_name?: string | null;
            total_price: number;

            created_at: string;
        };
        TelegramBotOrdersRequest: {
            telegram_id: number;
        };
        TelegramBotRegisterRequest: {
            telegram_id: number;
            telegram_username?: string | null;
            name: string;
        };
        TelegramBotVendorStatusRequest: {
            telegram_id: number;
        };
        TelegramBotVendorStatusResponse: {
            is_vendor: boolean;
            approval_status?: string | null;
            rejection_reason?: string | null;
        };
        TelegramCheckRequest: {
            init_data: string;
        };
        TelegramCheckResponse: {
            status: string;
            phone_number?: string | null;
        };
        TelegramRegisterRequest: {
            init_data: string;
            phone_number: string;
            name: string;
        };
        TelegramSiteLoginByUsernameRequest: {
            telegram_username: string;
        };
        TelegramSiteLoginResponse: {
            access_token: string;
            refresh_token: string;

            token_type: string;

            requires_password: boolean;
        };
        TelegramSiteLoginStartRequest: {
            phone_number: string;
        };
        TelegramSiteLoginStartResponse: {

            message: string;
        };
        TelegramSiteLoginVerifyByUsernameRequest: {
            telegram_username: string;
            code: string;
        };
        TelegramSiteLoginVerifyRequest: {
            phone_number: string;
            code: string;
        };
        TelegramSitePasswordRequest: {
            password: string;
        };
        TokenResponse: {
            access_token: string;
            refresh_token: string;

            token_type: string;
        };
        UserCreate: {
            name: string;
            phone_number: string;
            password: string;
        };
        UserLogin: {
            phone_number: string;
            password: string;
        };
        UserPublicRead: {

            id: string;
            name: string;
        };
        UserRead: {
            name: string;

            phone_number: string;

            id: string;
            permissions: components["schemas"]["Permission"][];

            has_password: boolean;
            first_name?: string | null;
            last_name?: string | null;
            middle_name?: string | null;
            email?: string | null;
            telegram_id?: number | null;
            telegram_username?: string | null;
        };
        UserUpdate: {
            name?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            middle_name?: string | null;
            email?: string | null;
            phone_number?: string | null;
        };
        ValidationError: {
            loc: (string | number)[];
            msg: string;
            type: string;
        };
        VendorCreate: Record<string, never>;
        VendorResponse: {

            id: string;

            user_id: string;

            approval_status: string;
            rejection_reason?: string | null;
        };
        WorkingHoursBulkSet: {
            hours: components["schemas"]["WorkingHoursEntry"][];
        };
        WorkingHoursEntry: {
            day_of_week: number;
            open_time: string;
            close_time: string;

            is_closed: boolean;
        };
        WorkingHoursRead: {
            day_of_week: number;
            open_time: string;
            close_time: string;

            is_closed: boolean;

            id: string;

            restaurant_id: string;
        };
    };
    responses: never;
    parameters: never;
    requestBodies: never;
    headers: never;
    pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
    read_users_api_v1_admin_users_get: {
        parameters: {
            query?: {
                role?: string | null;
                search?: string | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_deactivate_users_api_v1_admin_users_batch_deactivate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchIdsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_activate_users_api_v1_admin_users_batch_activate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchIdsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_user_api_v1_admin_users__user_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_user_api_v1_admin_users__user_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    activate_user_api_v1_admin_users__user_id__activate_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    grant_admin_permissions_api_v1_admin_users__user_id__grant_admin_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    change_user_permissions_api_v1_admin_users__user_id__permissions_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["SetPermissionsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reset_my_permissions_api_v1_admin_me_reset_permissions_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminUserResponse_"];
                };
            };
        };
    };
    read_restaurants_api_v1_admin_restaurants_get: {
        parameters: {
            query?: {
                search?: string | null;
                vendor_search?: string | null;
                is_open?: boolean | null;
                moderation_status?: string | null;
                min_rating?: number | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_AdminRestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_approve_restaurants_api_v1_admin_restaurants_batch_approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchIdsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_reject_restaurants_api_v1_admin_restaurants_batch_reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchRejectRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_restaurant_api_v1_admin_restaurants__restaurant_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminRestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_restaurant_api_v1_admin_restaurants__restaurant_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminRestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    approve_restaurant_api_v1_admin_restaurants__restaurant_id__approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminRestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reject_restaurant_api_v1_admin_restaurants__restaurant_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ModerationDecision"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminRestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_vendors_api_v1_admin_vendors_get: {
        parameters: {
            query?: {
                search?: string | null;
                approval_status?: string | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_AdminVendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_approve_vendors_api_v1_admin_vendors_batch_approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchIdsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_reject_vendors_api_v1_admin_vendors_batch_reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchRejectRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_vendor_api_v1_admin_vendors__vendor_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendor_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminVendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_vendor_api_v1_admin_vendors__vendor_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendor_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminVendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    approve_vendor_api_v1_admin_vendors__vendor_id__approve_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendor_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminVendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    reject_vendor_api_v1_admin_vendors__vendor_id__reject_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                vendor_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ModerationDecision"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminVendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_reviews_api_v1_admin_reviews_get: {
        parameters: {
            query?: {
                rating?: number | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_AdminReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    batch_delete_reviews_api_v1_admin_reviews_batch_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["BatchIdsRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_dict_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_review_api_v1_admin_reviews__review_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                review_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdminReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_orders_api_v1_admin_orders_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["OrderStatus"] | null;
                restaurant_id?: string | null;
                user_id?: string | null;
                search?: string | null;
                date_from?: string | null;
                date_to?: string | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_platform_stats_api_v1_admin_stats_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_PlatformStats_"];
                };
            };
        };
    };
    read_finance_api_v1_admin_finance_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_FinanceAnalytics_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_advanced_analytics_api_v1_admin_analytics_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdvancedAnalytics_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_audit_logs_api_v1_admin_audit_logs_get: {
        parameters: {
            query?: {
                action?: string | null;
                entity_type?: string | null;
                actor_id?: string | null;
                date_from?: string | null;
                date_to?: string | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_users_csv_api_v1_admin_export_users_csv_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_orders_csv_api_v1_admin_export_orders_csv_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                status?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_restaurants_csv_api_v1_admin_export_restaurants_csv_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    export_vendors_csv_api_v1_admin_export_vendors_csv_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    export_reviews_csv_api_v1_admin_export_reviews_csv_get: {
        parameters: {
            query?: {
                min_rating?: number | null;
                max_rating?: number | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_finance_pdf_api_v1_admin_export_finance_pdf_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_analytics_pdf_api_v1_admin_export_analytics_pdf_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_overview_pdf_api_v1_admin_export_overview_pdf_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    advisor_chat_api_v1_ai_advisor_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AdvisorChatRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    advisor_insights_api_v1_ai_advisor_insights_get: {
        parameters: {
            query?: {
                refresh?: boolean;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdvisorInsightsResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    order_chat_api_v1_ai_order_chat_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrderChatRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_cart_api_v1_cart_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_CartResponse_"];
                };
            };
        };
    };
    update_cart_api_v1_cart_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["CartUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_CartResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    clear_cart_api_v1_cart_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    list_promos_api_v1_promos_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_PromoResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_promo_api_v1_promos_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PromoCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_PromoResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    deactivate_promo_api_v1_promos__code__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                code: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    validate_promo_api_v1_promos_validate_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["PromoValidateRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_PromoValidateResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_registration_api_v1_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserCreate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_login_api_v1_login_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserLogin"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TokenResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_refresh_api_v1_refresh_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TokenResponse_"];
                };
            };
        };
    };
    create_logout_api_v1_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    get_my_favorites_api_v1_favorites_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_FavoriteResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    add_favorite_api_v1_favorites__restaurant_id__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_FavoriteResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_favorite_api_v1_favorites__restaurant_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_my_staff_profile_api_v1_staff_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_StaffProfileResponse_"];
                };
            };
        };
    };
    get_my_application_api_v1_staff_my_application_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_StaffRequestResponse_"] | null;
                };
            };
        };
    };
    create_staff_request_api_v1_staff_requests__restaurant_id__post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffRequestCreate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_StaffRequestResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_staff_status_api_v1_staff_requests__request_id__status_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                request_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["StaffRequestStatusUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_StaffRequestResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_vendor_requests_api_v1_staff_my_requests_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_StaffRequestResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_vendor_members_api_v1_staff_my_members_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_StaffMemberResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    remove_staff_member_api_v1_staff_members__profile_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                profile_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    staff_toggle_item_availability_api_v1_staff_menu__restaurant_id__items__item_id__availability_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_my_vendor_profile_api_v1_vendors__get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_VendorResponse_"];
                };
            };
        };
    };
    create_vendor_api_v1_vendors__post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["VendorCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_VendorResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_vendor_finance_api_v1_vendors_finance_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_FinanceAnalytics_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_vendor_analytics_api_v1_vendors_analytics_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_AdvancedAnalytics_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_orders_csv_api_v1_vendors_export_orders_csv_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                status?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_menu_csv_api_v1_vendors_export_menu_csv_get: {
        parameters: {
            query?: {
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_promos_csv_api_v1_vendors_export_promos_csv_get: {
        parameters: {
            query?: {
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_finance_pdf_api_v1_vendors_export_finance_pdf_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    export_analytics_pdf_api_v1_vendors_export_analytics_pdf_get: {
        parameters: {
            query?: {
                date_from?: string | null;
                date_to?: string | null;
                restaurant_id?: string | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_public_restaurant_api_v1_restaurants_public__restaurant_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_public_restaurants_api_v1_restaurants_public_get: {
        parameters: {
            query?: {
                name?: string | null;
                is_hiring?: boolean | null;
                is_open?: boolean | null;
                sort?: components["schemas"]["RestaurantSort"];
                direction?: components["schemas"]["SortDirection"];
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_my_restaurants_api_v1_restaurants__get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_restaurant_api_v1_restaurants__post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RestaurantCreate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_restaurant_api_v1_restaurants__restaurant_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["RestaurantUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_restaurant_photo_api_v1_restaurants__restaurant_id__photo_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_restaurant_photo_api_v1_restaurants__restaurant_id__photo_post"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_restaurant_photo_api_v1_restaurants__restaurant_id__photo_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RestaurantResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_working_hours_api_v1_restaurants__restaurant_id__working_hours_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_list_WorkingHoursRead__"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    set_working_hours_endpoint_api_v1_restaurants__restaurant_id__working_hours_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["WorkingHoursBulkSet"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_list_WorkingHoursRead__"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_media_api_v1_media__key__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                key: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_menu_item_api_v1_menu__restaurant_id__items_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_menu_item_api_v1_menu__restaurant_id__items__item_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_menu_item_api_v1_menu__restaurant_id__items__item_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    upload_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "multipart/form-data": components["schemas"]["Body_upload_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_post"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_menu_item_photo_api_v1_menu__restaurant_id__items__item_id__photo_delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    toggle_item_availability_api_v1_menu__restaurant_id__items__item_id__availability_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["AvailabilityUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemOptionGroupCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemOptionGroupResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
                group_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_option_group_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
                group_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemOptionGroupUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemOptionGroupResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
                group_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemOptionCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemOptionResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options__option_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
                group_id: string;
                option_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_option_api_v1_menu__restaurant_id__items__item_id__option_groups__group_id__options__option_id__patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                item_id: string;
                group_id: string;
                option_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MenuItemOptionUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_MenuItemOptionResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_restaurant_menu_api_v1_menu__restaurant_id__get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_MenuItemResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_order_api_v1_orders__post: {
        parameters: {
            query?: never;
            header?: {
                "Idempotency-Key"?: string | null;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrderCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_order_load_estimate_api_v1_orders_estimate__restaurant_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderLoadEstimate_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_my_orders_api_v1_orders_me_get: {
        parameters: {
            query?: {
                status?: components["schemas"]["OrderStatus"] | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_restaurant_orders_api_v1_orders_restaurant__restaurant_id__get: {
        parameters: {
            query?: {
                status?: components["schemas"]["OrderStatus"] | null;
                date_from?: string | null;
                date_to?: string | null;
                page?: number;
                size?: number;
            };
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_order_status_api_v1_orders__order_id__status_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrderStatusUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_order_events_api_v1_orders__order_id__events_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_OrderEventResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    cancel_order_api_v1_orders__order_id__cancel_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrderCancelRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    complete_order_api_v1_orders__order_id__complete_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_order_api_v1_orders__order_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                order_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_OrderResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_reviews_api_v1_restaurants__restaurant_id__reviews_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_ReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    create_review_api_v1_restaurants__restaurant_id__reviews_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewCreate"];
            };
        };
        responses: {
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_ReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_my_review_api_v1_restaurants__restaurant_id__reviews__review_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
                review_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_ReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    update_my_review_api_v1_restaurants__restaurant_id__reviews_my_put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ReviewCreate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_ReviewResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_rating_api_v1_restaurants__restaurant_id__rating_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                restaurant_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_RatingResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_check_api_v1_telegram_check_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramCheckRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramCheckResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_register_api_v1_telegram_register_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramRegisterRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TokenResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_auth_api_v1_telegram_auth_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramCheckRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TokenResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_site_login_request_code_api_v1_telegram_site_login_request_code_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramSiteLoginStartRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramSiteLoginStartResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_site_login_request_code_by_username_api_v1_telegram_site_login_request_code_by_username_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramSiteLoginByUsernameRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramSiteLoginStartResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_site_login_verify_api_v1_telegram_site_login_verify_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramSiteLoginVerifyRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramSiteLoginResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_site_login_verify_by_username_api_v1_telegram_site_login_verify_by_username_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramSiteLoginVerifyByUsernameRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramSiteLoginResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_site_login_set_password_api_v1_telegram_site_login_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramSitePasswordRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_logout_api_v1_telegram_logout_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
        };
    };
    telegram_bot_register_api_v1_telegram_bot_register_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Telegram-Bot-Secret"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramBotRegisterRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_bot_link_phone_api_v1_telegram_bot_link_phone_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Telegram-Bot-Secret"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramBotLinkRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_bot_vendor_status_api_v1_telegram_bot_vendor_status_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Telegram-Bot-Secret"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramBotVendorStatusRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_TelegramBotVendorStatusResponse_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    telegram_bot_orders_api_v1_telegram_bot_orders_post: {
        parameters: {
            query?: never;
            header?: {
                "X-Telegram-Bot-Secret"?: string;
            };
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["TelegramBotOrdersRequest"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessListResponse_TelegramBotOrderSummary_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_my_profile_api_v1_users_me_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
        };
    };
    update_my_profile_api_v1_users_me_patch: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["UserUpdate"];
            };
        };
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    change_my_password_api_v1_users_me_change_password_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ChangePasswordRequest"];
            };
        };
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_user_api_v1_users__user_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                user_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["SuccessResponse_UserRead_"] | components["schemas"]["SuccessResponse_UserPublicRead_"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    get_my_notifications_api_v1_notifications_get: {
        parameters: {
            query?: {
                page?: number;
                size?: number;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationListResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    delete_all_notifications_api_v1_notifications_delete: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
        };
    };
    read_notification_api_v1_notifications__notification_id__read_post: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notification_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["NotificationResponse"];
                };
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    read_all_notifications_api_v1_notifications_read_all_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": {
                        [key: string]: unknown;
                    };
                };
            };
        };
    };
    delete_notification_api_v1_notifications__notification_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                notification_id: string;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            422: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["HTTPValidationError"];
                };
            };
        };
    };
    ping_api_ping_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
    health_api_health_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": unknown;
                };
            };
        };
    };
}
