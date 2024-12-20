# Cauldron Authentication

## What does this do?

Cauldron Authentication is responsible
for authenticating Minecraft Users
using the [Microsoft Authentication System](https://wiki.vg/Microsoft_Authentication_Scheme)
which is the only way to log in to Mojang now.
This package provides all the tools needed to acquire a Minecraft Access token from an oauth token.

## Setup

To Install the package, run the following command

```
npm i @jackcooper04/cauldronauthentication --save
```

## Using Cauldron Authentication

## Information

To use this package, you need to provide a way to get an access token.
To do this, you need to create an Azure application.
See [here](https://docs.cauldronmc.com/authentication/authentication) for more information.

[Wiki.vg](https://wiki.vg/) provides lots of information on how various parts of Minecraft works.


## Functions

### startAuthenticationFlow (azureCredentials, refreshToken)

This function performs the authentication flow turning a refresh token into a minecraft access token and getting the profile information for the user.

It takes the following parameters

- azureCredentials (Required)

```json
{
  "CLIENT_ID": "AZURE_CLIENT_ID",
  "REDIRECT_URI": "REDIRECT_URL",
  "VERIFY_CODE": "CODE_USED_TO_VERIFY_LOGINS"
}
```

- refreshToken (Required)—Refresh Token from original oauth flow

On completion,
the function will return an object that can be used to launch a Minecraft Instance.

### Sample Output

```json
{
  "toReturn": {
    "refresh_token": "REFRESH_TOKEN",
    "profile": {
      "uuid": "069a79f444e94726a5befca90e38aaf5",
      "username": "Notch"
    },
    "xui": "0000000000000000",
    "access_token": "ACCESS_TOKEN",
    "user_id": "aaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa"
  }
}
```

## Additional Modules

| Name                                                  | Import                                     | Description                                 |
|-------------------------------------------------------|--------------------------------------------|---------------------------------------------|
| [MAS](https://docs.cauldronmc.com/authentication/mas) | `@jackcooper04/cauldronauthentication/mas` | Provides Access to the individual functions |

