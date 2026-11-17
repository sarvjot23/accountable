// Generated from the backend's OpenAPI schema by `npm run types`. Do not edit by hand.

export interface paths {
    "/api/activities": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        put?: never;
        /** Create Activity */
        post: operations["create_activity_api_activities_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activity_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        get?: never;
        /** Update Activity */
        put: operations["update_activity_api_activities__activity_id__put"];
        post?: never;
        /** Delete Activity */
        delete: operations["delete_activity_api_activities__activity_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activity_id}/delete-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Activity Delete Impact */
        get: operations["activity_delete_impact_api_activities__activity_id__delete_impact_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/activities/{activity_id}/done": {
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
        /** Mark Done */
        patch: operations["mark_done_api_activities__activity_id__done_patch"];
        trace?: never;
    };
    "/api/contacts": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Contacts */
        get: operations["list_contacts_api_contacts_get"];
        put?: never;
        /** Create Contact */
        post: operations["create_contact_api_contacts_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/contacts/{contact_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Contact */
        get: operations["get_contact_api_contacts__contact_id__get"];
        /** Update Contact */
        put: operations["update_contact_api_contacts__contact_id__put"];
        post?: never;
        /** Delete Contact */
        delete: operations["delete_contact_api_contacts__contact_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/contacts/{contact_id}/delete-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Contact Delete Impact */
        get: operations["contact_delete_impact_api_contacts__contact_id__delete_impact_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/contacts/{contact_id}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Contact Timeline */
        get: operations["contact_timeline_api_contacts__contact_id__timeline_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/dashboard": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Dashboard */
        get: operations["dashboard_api_dashboard_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deals": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Deals */
        get: operations["list_deals_api_deals_get"];
        put?: never;
        /** Create Deal */
        post: operations["create_deal_api_deals_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deals/{deal_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Deal */
        get: operations["get_deal_api_deals__deal_id__get"];
        /** Update Deal */
        put: operations["update_deal_api_deals__deal_id__put"];
        post?: never;
        /** Delete Deal */
        delete: operations["delete_deal_api_deals__deal_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deals/{deal_id}/delete-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Deal Delete Impact */
        get: operations["deal_delete_impact_api_deals__deal_id__delete_impact_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/deals/{deal_id}/move": {
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
        /** Move Deal */
        patch: operations["move_deal_api_deals__deal_id__move_patch"];
        trace?: never;
    };
    "/api/deals/{deal_id}/timeline": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Deal Timeline */
        get: operations["deal_timeline_api_deals__deal_id__timeline_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/meta/stages": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Stages */
        get: operations["list_stages_api_meta_stages_get"];
        put?: never;
        post?: never;
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organizations": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** List Organizations */
        get: operations["list_organizations_api_organizations_get"];
        put?: never;
        /** Create Organization */
        post: operations["create_organization_api_organizations_post"];
        delete?: never;
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organizations/{organization_id}": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Get Organization */
        get: operations["get_organization_api_organizations__organization_id__get"];
        /** Update Organization */
        put: operations["update_organization_api_organizations__organization_id__put"];
        post?: never;
        /** Delete Organization */
        delete: operations["delete_organization_api_organizations__organization_id__delete"];
        options?: never;
        head?: never;
        patch?: never;
        trace?: never;
    };
    "/api/organizations/{organization_id}/delete-impact": {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        /** Organization Delete Impact */
        get: operations["organization_delete_impact_api_organizations__organization_id__delete_impact_get"];
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
        /** ActivityDeleteImpact */
        ActivityDeleteImpact: {
            /** Stage Change */
            stage_change: boolean;
        };
        /** ActivityIn */
        ActivityIn: {
            /** Contact Id */
            contact_id?: number | null;
            /** Deal Id */
            deal_id?: number | null;
            /** Description */
            description: string;
            /** Follow Up Date */
            follow_up_date?: string | null;
            /** Occurred At */
            occurred_at?: string | null;
            /**
             * Type
             * @default note
             * @enum {string}
             */
            type: "note" | "call" | "email";
        };
        /** ActivityOut */
        ActivityOut: {
            /** Contact Id */
            contact_id: number | null;
            /** Contact Name */
            contact_name: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Deal Id */
            deal_id: number | null;
            /** Deal Name */
            deal_name: string | null;
            /** Description */
            description: string;
            /** Follow Up Date */
            follow_up_date: string | null;
            /** Follow Up Done */
            follow_up_done: boolean;
            /** Follow Up Status */
            follow_up_status: ("overdue" | "today" | "upcoming") | null;
            /** From Stage */
            from_stage: string | null;
            /** Id */
            id: number;
            /**
             * Occurred At
             * Format: date-time
             */
            occurred_at: string;
            /** Organization Id */
            organization_id: number | null;
            /** Organization Name */
            organization_name: string | null;
            /** To Stage */
            to_stage: string | null;
            /**
             * Type
             * @enum {string}
             */
            type: "note" | "call" | "email" | "stage_change";
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** ContactDeleteImpact */
        ContactDeleteImpact: {
            /** Activities */
            activities: number;
            /** Deals */
            deals: number;
        };
        /** ContactDetail */
        ContactDetail: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Deals */
            deals: components["schemas"]["DealOut"][];
            /** Email */
            email: string | null;
            /** First Name */
            first_name: string;
            /** Id */
            id: number;
            /** Job Title */
            job_title: string | null;
            /** Last Name */
            last_name: string | null;
            /** Name */
            name: string;
            /** Organization Id */
            organization_id: number | null;
            /** Organization Name */
            organization_name: string | null;
            /** Phone */
            phone: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "lead" | "qualified" | "customer";
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** ContactIn */
        ContactIn: {
            /** Email */
            email?: string | null;
            /** First Name */
            first_name: string;
            /** Job Title */
            job_title?: string | null;
            /** Last Name */
            last_name?: string | null;
            /** Organization Id */
            organization_id?: number | null;
            /** Phone */
            phone?: string | null;
            /**
             * Status
             * @default lead
             * @enum {string}
             */
            status: "lead" | "qualified" | "customer";
        };
        /** ContactOut */
        ContactOut: {
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Email */
            email: string | null;
            /** First Name */
            first_name: string;
            /** Id */
            id: number;
            /** Job Title */
            job_title: string | null;
            /** Last Name */
            last_name: string | null;
            /** Name */
            name: string;
            /** Organization Id */
            organization_id: number | null;
            /** Organization Name */
            organization_name: string | null;
            /** Phone */
            phone: string | null;
            /**
             * Status
             * @enum {string}
             */
            status: "lead" | "qualified" | "customer";
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
        };
        /** Dashboard */
        Dashboard: {
            /** Deals Won 12 Months */
            deals_won_12_months: number;
            expected_revenue: components["schemas"]["ExpectedRevenue"];
            follow_ups: components["schemas"]["FollowUps"];
            funnel: components["schemas"]["Funnel"];
            late_deals: components["schemas"]["LateDeals"];
            /** Monthly */
            monthly: components["schemas"]["Month"][];
            open_pipeline: components["schemas"]["OpenPipeline"];
            /** Recent Activity */
            recent_activity: components["schemas"]["ActivityOut"][];
            /** Revenue Won 12 Months */
            revenue_won_12_months: number;
            /**
             * Today
             * Format: date
             */
            today: string;
            won_this_month: components["schemas"]["WonThisMonth"];
        };
        /** DealDeleteImpact */
        DealDeleteImpact: {
            /** Activities */
            activities: number;
        };
        /** DealIn */
        DealIn: {
            /** Close Date */
            close_date?: string | null;
            /** Contact Id */
            contact_id?: number | null;
            /** Name */
            name: string;
            /** Organization Id */
            organization_id?: number | null;
            /** Probability */
            probability?: number | null;
            /**
             * Stage
             * @default new
             * @enum {string}
             */
            stage: "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
            /** Value */
            value: number;
        };
        /** DealOut */
        DealOut: {
            /** Close Date */
            close_date: string | null;
            /** Close Date Manual */
            close_date_manual: boolean;
            /** Contact Id */
            contact_id: number | null;
            /** Contact Name */
            contact_name: string | null;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Expected Revenue */
            expected_revenue: number;
            /** Id */
            id: number;
            /** Is Late */
            is_late: boolean;
            /** Name */
            name: string;
            /** Organization Id */
            organization_id: number;
            /** Organization Name */
            organization_name: string;
            /** Position */
            position: number;
            /** Probability */
            probability: number;
            /** Probability Manual */
            probability_manual: boolean;
            /**
             * Stage
             * @enum {string}
             */
            stage: "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
            /**
             * Stage Changed At
             * Format: date-time
             */
            stage_changed_at: string;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Value */
            value: number;
        };
        /** DoneIn */
        DoneIn: {
            /**
             * Done
             * @default true
             */
            done: boolean;
        };
        /** ExpectedRevenue */
        ExpectedRevenue: {
            /** Share */
            share: number;
            /** Value */
            value: number;
        };
        /** FollowUps */
        FollowUps: {
            /** Due Today */
            due_today: number;
            /** Items */
            items: components["schemas"]["ActivityOut"][];
            /** Overdue */
            overdue: number;
            /** Upcoming */
            upcoming: number;
        };
        /** Funnel */
        Funnel: {
            /** New Count */
            new_count: number;
            /** New To Won Share */
            new_to_won_share: number;
            /** Stages */
            stages: components["schemas"]["FunnelStage"][];
            /** Won Count */
            won_count: number;
        };
        /** FunnelStage */
        FunnelStage: {
            /** Count */
            count: number;
            /** Label */
            label: string;
            /** Share */
            share: number;
            /** Stage */
            stage: string;
            /** Value */
            value: number;
        };
        /** HTTPValidationError */
        HTTPValidationError: {
            /** Detail */
            detail?: components["schemas"]["ValidationError"][];
        };
        /** LateDeals */
        LateDeals: {
            /** Count */
            count: number;
            /** Share Of Open */
            share_of_open: number;
            /** Value */
            value: number;
        };
        /** Month */
        Month: {
            /** Deals Won */
            deals_won: number;
            /** Month */
            month: string;
            /** Revenue Won */
            revenue_won: number;
        };
        /**
         * MoveIn
         * @description A card dropped on the board: its stage, and the cards just above (before) and below (after) it.
         */
        MoveIn: {
            /** After Id */
            after_id?: number | null;
            /** Before Id */
            before_id?: number | null;
            /**
             * Stage
             * @enum {string}
             */
            stage: "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
        };
        /** OpenPipeline */
        OpenPipeline: {
            /** Count */
            count: number;
            /** Value */
            value: number;
        };
        /** OrganizationDeleteImpact */
        OrganizationDeleteImpact: {
            /** Activities */
            activities: number;
            /** Contacts */
            contacts: number;
            /** Deals */
            deals: number;
        };
        /** OrganizationDetail */
        OrganizationDetail: {
            /** Contacts */
            contacts: components["schemas"]["ContactOut"][];
            /** Contacts Count */
            contacts_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Deals */
            deals: components["schemas"]["DealOut"][];
            /** Id */
            id: number;
            /** Industry */
            industry: string | null;
            /** Name */
            name: string;
            /** Notes */
            notes: string | null;
            /** Open Deals Count */
            open_deals_count: number;
            /** Open Value */
            open_value: number;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Website */
            website: string | null;
        };
        /** OrganizationIn */
        OrganizationIn: {
            /** Industry */
            industry?: string | null;
            /** Name */
            name: string;
            /** Notes */
            notes?: string | null;
            /** Website */
            website?: string | null;
        };
        /** OrganizationOut */
        OrganizationOut: {
            /** Contacts Count */
            contacts_count: number;
            /**
             * Created At
             * Format: date-time
             */
            created_at: string;
            /** Id */
            id: number;
            /** Industry */
            industry: string | null;
            /** Name */
            name: string;
            /** Notes */
            notes: string | null;
            /** Open Deals Count */
            open_deals_count: number;
            /** Open Value */
            open_value: number;
            /**
             * Updated At
             * Format: date-time
             */
            updated_at: string;
            /** Website */
            website: string | null;
        };
        /** StageOut */
        StageOut: {
            /** Color */
            color: string;
            /** Key */
            key: string;
            /** Label */
            label: string;
            /** Open */
            open: boolean;
            /** Probability */
            probability: number;
            /** Text Color */
            text_color: string;
        };
        /** ValidationError */
        ValidationError: {
            /** Context */
            ctx?: Record<string, never>;
            /** Input */
            input?: unknown;
            /** Location */
            loc: (string | number)[];
            /** Message */
            msg: string;
            /** Error Type */
            type: string;
        };
        /** WonThisMonth */
        WonThisMonth: {
            /** Change */
            change: number;
            /** Count */
            count: number;
            /** Last Month Value */
            last_month_value: number;
            /** Share Of Best Month */
            share_of_best_month: number;
            /** Value */
            value: number;
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
    create_activity_api_activities_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivityIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityOut"];
                };
            };
            /** @description Validation Error */
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
    update_activity_api_activities__activity_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ActivityIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityOut"];
                };
            };
            /** @description Validation Error */
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
    delete_activity_api_activities__activity_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
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
    activity_delete_impact_api_activities__activity_id__delete_impact_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityDeleteImpact"];
                };
            };
            /** @description Validation Error */
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
    mark_done_api_activities__activity_id__done_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                activity_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DoneIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityOut"];
                };
            };
            /** @description Validation Error */
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
    list_contacts_api_contacts_get: {
        parameters: {
            query?: {
                status?: ("lead" | "qualified" | "customer") | null;
            };
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactOut"][];
                };
            };
            /** @description Validation Error */
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
    create_contact_api_contacts_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactOut"];
                };
            };
            /** @description Validation Error */
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
    get_contact_api_contacts__contact_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contact_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactDetail"];
                };
            };
            /** @description Validation Error */
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
    update_contact_api_contacts__contact_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contact_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["ContactIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactOut"];
                };
            };
            /** @description Validation Error */
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
    delete_contact_api_contacts__contact_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contact_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
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
    contact_delete_impact_api_contacts__contact_id__delete_impact_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contact_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ContactDeleteImpact"];
                };
            };
            /** @description Validation Error */
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
    contact_timeline_api_contacts__contact_id__timeline_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                contact_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityOut"][];
                };
            };
            /** @description Validation Error */
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
    dashboard_api_dashboard_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["Dashboard"];
                };
            };
        };
    };
    list_deals_api_deals_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealOut"][];
                };
            };
        };
    };
    create_deal_api_deals_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DealIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealOut"];
                };
            };
            /** @description Validation Error */
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
    get_deal_api_deals__deal_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealOut"];
                };
            };
            /** @description Validation Error */
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
    update_deal_api_deals__deal_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["DealIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealOut"];
                };
            };
            /** @description Validation Error */
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
    delete_deal_api_deals__deal_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
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
    deal_delete_impact_api_deals__deal_id__delete_impact_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealDeleteImpact"];
                };
            };
            /** @description Validation Error */
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
    move_deal_api_deals__deal_id__move_patch: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["MoveIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["DealOut"];
                };
            };
            /** @description Validation Error */
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
    deal_timeline_api_deals__deal_id__timeline_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                deal_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["ActivityOut"][];
                };
            };
            /** @description Validation Error */
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
    list_stages_api_meta_stages_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["StageOut"][];
                };
            };
        };
    };
    list_organizations_api_organizations_get: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationOut"][];
                };
            };
        };
    };
    create_organization_api_organizations_post: {
        parameters: {
            query?: never;
            header?: never;
            path?: never;
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrganizationIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            201: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationOut"];
                };
            };
            /** @description Validation Error */
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
    get_organization_api_organizations__organization_id__get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                organization_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationDetail"];
                };
            };
            /** @description Validation Error */
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
    update_organization_api_organizations__organization_id__put: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                organization_id: number;
            };
            cookie?: never;
        };
        requestBody: {
            content: {
                "application/json": components["schemas"]["OrganizationIn"];
            };
        };
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationOut"];
                };
            };
            /** @description Validation Error */
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
    delete_organization_api_organizations__organization_id__delete: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                organization_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            204: {
                headers: {
                    [name: string]: unknown;
                };
                content?: never;
            };
            /** @description Validation Error */
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
    organization_delete_impact_api_organizations__organization_id__delete_impact_get: {
        parameters: {
            query?: never;
            header?: never;
            path: {
                organization_id: number;
            };
            cookie?: never;
        };
        requestBody?: never;
        responses: {
            /** @description Successful Response */
            200: {
                headers: {
                    [name: string]: unknown;
                };
                content: {
                    "application/json": components["schemas"]["OrganizationDeleteImpact"];
                };
            };
            /** @description Validation Error */
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
}
