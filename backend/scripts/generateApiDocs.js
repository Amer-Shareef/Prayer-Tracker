const fs = require('fs');
const path = require('path');

async function generateApiDocs() {
  console.log('📚 Generating Prayer Tracker API Documentation');
  console.log('===============================================');
  
  try {
    const docsDir = path.join(__dirname, '..', '..', 'docs');
    
    // Create docs directory if it doesn't exist
    if (!fs.existsSync(docsDir)) {
      fs.mkdirSync(docsDir, { recursive: true });
      console.log('✅ Created docs directory');
    }

    // API Endpoints Summary
    const apiSummary = `
# Prayer Tracker API Summary

## Base URL
\`\`\`
http://localhost:5000/api
\`\`\`

## Authentication
All endpoints require JWT token:
\`\`\`
Authorization: Bearer <token>
\`\`\`

## Main Endpoints

### Authentication
- \`POST /auth/login\` - User login with OTP
- \`POST /auth/forgot-password\` - Request password reset
- \`POST /auth/reset-password\` - Reset password with token
- \`POST /auth/change-password\` - Change current password

### Pickup Requests 🚗
- \`GET /pickup-requests\` - Get user's pickup requests
- \`POST /pickup-requests\` - Create new Fajr pickup request
- \`PUT /pickup-requests/:id\` - Update pickup request
- \`DELETE /pickup-requests/:id\` - Cancel pickup request

### Prayers 🕌
- \`GET /prayers\` - Get user's prayers
- \`POST /prayers\` - Record prayer
- \`PUT /prayers/:id\` - Update prayer status
- \`GET /prayers/stats\` - Get prayer statistics

### Daily Activities 📊
- \`GET /daily-activities\` - Get daily activities
- \`POST /daily-activities\` - Record activity (Zikr/Quran)
- \`GET /daily-activities/stats\` - Get activity statistics

### Mosques 🕌
- \`GET /mosques\` - Get mosque information
- \`GET /mosques/prayer-times\` - Get prayer times

### Announcements 📢
- \`GET /announcements\` - Get mosque announcements

## Status Codes
- \`200\` - Success
- \`201\` - Created
- \`400\` - Bad Request
- \`401\` - Unauthorized
- \`403\` - Forbidden
- \`404\` - Not Found
- \`500\` - Server Error

## Features
✅ Fajr pickup requests
✅ Prayer tracking with streaks
✅ Daily Zikr and Quran activities
✅ Real-time dashboard
✅ OTP authentication
✅ Password reset via email
✅ Comprehensive statistics
✅ Mobile-responsive design
`;

    // Write API summary
    fs.writeFileSync(path.join(docsDir, 'API-Summary.md'), apiSummary);
    console.log('✅ Generated API-Summary.md');

    // Copy pickup requests documentation if it exists
    const pickupApiFile = path.join(docsDir, 'Pickup-Requests-API.md');
    if (fs.existsSync(pickupApiFile)) {
      console.log('✅ Pickup-Requests-API.md already exists');
    } else {
      console.log('📝 Pickup-Requests-API.md should be created manually');
    }

    // Generate Postman collection
    const postmanCollection = {
      info: {
        name: "Prayer Tracker API",
        description: "Complete API collection for Prayer Tracker application",
        version: "1.0.0"
      },
      auth: {
        type: "bearer",
        bearer: [
          {
            key: "token",
            value: "{{token}}",
            type: "string"
          }
        ]
      },
      variable: [
        {
          key: "base_url",
          value: "http://localhost:5000/api",
          type: "string"
        }
      ],
      item: [
        {
          name: "Authentication",
          item: [
            {
              name: "Login",
              request: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    username: "abdullah",
                    password: "abc123"
                  })
                },
                url: {
                  raw: "{{base_url}}/auth/login",
                  host: ["{{base_url}}"],
                  path: ["auth", "login"]
                }
              }
            }
          ]
        },
        {
          name: "Pickup Requests",
          item: [
            {
              name: "Get My Requests",
              request: {
                method: "GET",
                url: {
                  raw: "{{base_url}}/pickup-requests?limit=10",
                  host: ["{{base_url}}"],
                  path: ["pickup-requests"],
                  query: [
                    {
                      key: "limit",
                      value: "10"
                    }
                  ]
                }
              }
            },
            {
              name: "Create Request",
              request: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    request_date: "2025-06-25",
                    pickup_location: "House #123, Main Street, near ABC Shop"
                  })
                },
                url: {
                  raw: "{{base_url}}/pickup-requests",
                  host: ["{{base_url}}"],
                  path: ["pickup-requests"]
                }
              }
            },
            {
              name: "Cancel Request",
              request: {
                method: "DELETE",
                url: {
                  raw: "{{base_url}}/pickup-requests/1",
                  host: ["{{base_url}}"],
                  path: ["pickup-requests", "1"]
                }
              }
            }
          ]
        },
        {
          name: "Prayers",
          item: [
            {
              name: "Get Today's Prayers",
              request: {
                method: "GET",
                url: {
                  raw: "{{base_url}}/prayers?date={{today}}",
                  host: ["{{base_url}}"],
                  path: ["prayers"],
                  query: [
                    {
                      key: "date",
                      value: "{{today}}"
                    }
                  ]
                }
              }
            },
            {
              name: "Record Prayer",
              request: {
                method: "POST",
                header: [
                  {
                    key: "Content-Type",
                    value: "application/json"
                  }
                ],
                body: {
                  mode: "raw",
                  raw: JSON.stringify({
                    prayer_type: "Fajr",
                    prayer_date: "2025-06-18",
                    status: "prayed",
                    location: "mosque"
                  })
                },
                url: {
                  raw: "{{base_url}}/prayers",
                  host: ["{{base_url}}"],
                  path: ["prayers"]
                }
              }
            }
          ]
        }
      ]
    };

    // Write Postman collection
    fs.writeFileSync(
      path.join(docsDir, 'Prayer-Tracker-Postman-Collection.json'), 
      JSON.stringify(postmanCollection, null, 2)
    );
    console.log('✅ Generated Postman collection');

    // Generate README for docs folder
    const docsReadme = `
# Prayer Tracker API Documentation

This directory contains comprehensive API documentation for the Prayer Tracker application.

## Files

- \`API-Summary.md\` - Quick reference for all API endpoints
- \`Pickup-Requests-API.md\` - Detailed documentation for pickup requests
- \`Prayer-Tracker-Postman-Collection.json\` - Postman collection for testing

## Getting Started

1. **Start the application**:
   \`\`\`bash
   npm start
   \`\`\`

2. **Login to get token**:
   \`\`\`bash
   curl -X POST "http://localhost:5000/api/auth/login" \\
     -H "Content-Type: application/json" \\
     -d '{"username": "abdullah", "password": "abc123"}'
   \`\`\`

3. **Use token for authenticated requests**:
   \`\`\`bash
   curl -X GET "http://localhost:5000/api/pickup-requests" \\
     -H "Authorization: Bearer your-token-here"
   \`\`\`

## Testing

### Using Postman
1. Import \`Prayer-Tracker-Postman-Collection.json\`
2. Set environment variable \`base_url\` to \`http://localhost:5000/api\`
3. Login to get token
4. Test all endpoints

### Using curl
See individual API documentation files for curl examples.

## Features

✅ **Pickup Requests**: Request Fajr prayer transportation
✅ **Prayer Tracking**: Record daily prayers with streak calculation
✅ **Daily Activities**: Track Zikr count and Quran recitation
✅ **Statistics**: Comprehensive prayer and activity analytics
✅ **Authentication**: Secure JWT with OTP verification
✅ **Real-time Updates**: Live dashboard with current status

## Support

For issues or questions:
1. Check the detailed API documentation
2. Test with Postman collection
3. Review error messages and status codes
4. Contact development team

---

Generated on: ${new Date().toLocaleString()}
Version: 1.0.0
`;

    fs.writeFileSync(path.join(docsDir, 'README.md'), docsReadme);
    console.log('✅ Generated docs README.md');

    console.log('\n🎉 API documentation generation completed!');
    console.log('\n📁 Generated files:');
    console.log('  ✅ docs/API-Summary.md');
    console.log('  ✅ docs/Prayer-Tracker-Postman-Collection.json');
    console.log('  ✅ docs/README.md');
    console.log('\n📋 Next steps:');
    console.log('  1. Review the API documentation');
    console.log('  2. Import Postman collection for testing');
    console.log('  3. Share with frontend developers');
    console.log('  4. Update documentation as needed');

  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
  }
}

generateApiDocs();
