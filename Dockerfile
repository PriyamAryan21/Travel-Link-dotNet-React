# Use the official .NET 8 SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy the project file and restore dependencies
COPY ["Server/Server/Server.csproj", "Server/Server/"]
RUN dotnet restore "Server/Server/Server.csproj"

# Copy the rest of the backend code and build
COPY ["Server/Server/", "Server/Server/"]
WORKDIR "/src/Server/Server"
RUN dotnet build "Server.csproj" -c Release -o /app/build

# Publish the application
RUN dotnet publish "Server.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the official .NET 8 ASP.NET runtime image to run the app
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

# Set the port Render expects
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Server.dll"]
