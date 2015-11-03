<?xml version="1.0" encoding="utf-8"?>
<serviceModel xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" name="AcroFear.Azure" generation="1" functional="0" release="0" Id="297e16c8-537c-47b5-bc78-eb402eaaadd8" dslVersion="1.2.0.0" xmlns="http://schemas.microsoft.com/dsltools/RDSM">
  <groups>
    <group name="AcroFear.AzureGroup" generation="1" functional="0" release="0">
      <componentports>
        <inPort name="AcroFear:Endpoint1" protocol="http">
          <inToChannel>
            <lBChannelMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/LB:AcroFear:Endpoint1" />
          </inToChannel>
        </inPort>
      </componentports>
      <settings>
        <aCS name="AcroFear:Microsoft.WindowsAzure.Plugins.Diagnostics.ConnectionString" defaultValue="">
          <maps>
            <mapMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/MapAcroFear:Microsoft.WindowsAzure.Plugins.Diagnostics.ConnectionString" />
          </maps>
        </aCS>
        <aCS name="AcroFearInstances" defaultValue="[1,1,1]">
          <maps>
            <mapMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/MapAcroFearInstances" />
          </maps>
        </aCS>
      </settings>
      <channels>
        <lBChannel name="LB:AcroFear:Endpoint1">
          <toPorts>
            <inPortMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFear/Endpoint1" />
          </toPorts>
        </lBChannel>
      </channels>
      <maps>
        <map name="MapAcroFear:Microsoft.WindowsAzure.Plugins.Diagnostics.ConnectionString" kind="Identity">
          <setting>
            <aCSMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFear/Microsoft.WindowsAzure.Plugins.Diagnostics.ConnectionString" />
          </setting>
        </map>
        <map name="MapAcroFearInstances" kind="Identity">
          <setting>
            <sCSPolicyIDMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFearInstances" />
          </setting>
        </map>
      </maps>
      <components>
        <groupHascomponents>
          <role name="AcroFear" generation="1" functional="0" release="0" software="D:\Code\AcroFear\AcroFear.Azure\csx\Debug\roles\AcroFear" entryPoint="base\x64\WaHostBootstrapper.exe" parameters="base\x64\WaIISHost.exe " memIndex="-1" hostingEnvironment="frontendadmin" hostingEnvironmentVersion="2">
            <componentports>
              <inPort name="Endpoint1" protocol="http" portRanges="80" />
            </componentports>
            <settings>
              <aCS name="Microsoft.WindowsAzure.Plugins.Diagnostics.ConnectionString" defaultValue="" />
              <aCS name="__ModelData" defaultValue="&lt;m role=&quot;AcroFear&quot; xmlns=&quot;urn:azure:m:v1&quot;&gt;&lt;r name=&quot;AcroFear&quot;&gt;&lt;e name=&quot;Endpoint1&quot; /&gt;&lt;/r&gt;&lt;/m&gt;" />
            </settings>
            <resourcereferences>
              <resourceReference name="DiagnosticStore" defaultAmount="[4096,4096,4096]" defaultSticky="true" kind="Directory" />
              <resourceReference name="EventStore" defaultAmount="[1000,1000,1000]" defaultSticky="false" kind="LogStore" />
            </resourcereferences>
          </role>
          <sCSPolicy>
            <sCSPolicyIDMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFearInstances" />
            <sCSPolicyUpdateDomainMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFearUpgradeDomains" />
            <sCSPolicyFaultDomainMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFearFaultDomains" />
          </sCSPolicy>
        </groupHascomponents>
      </components>
      <sCSPolicy>
        <sCSPolicyUpdateDomain name="AcroFearUpgradeDomains" defaultPolicy="[5,5,5]" />
        <sCSPolicyFaultDomain name="AcroFearFaultDomains" defaultPolicy="[2,2,2]" />
        <sCSPolicyID name="AcroFearInstances" defaultPolicy="[1,1,1]" />
      </sCSPolicy>
    </group>
  </groups>
  <implements>
    <implementation Id="6b677c79-201d-4c09-a59e-3816ba19f6be" ref="Microsoft.RedDog.Contract\ServiceContract\AcroFear.AzureContract@ServiceDefinition">
      <interfacereferences>
        <interfaceReference Id="7e3e1116-c01d-417f-934e-f889c7cda9d5" ref="Microsoft.RedDog.Contract\Interface\AcroFear:Endpoint1@ServiceDefinition">
          <inPort>
            <inPortMoniker name="/AcroFear.Azure/AcroFear.AzureGroup/AcroFear:Endpoint1" />
          </inPort>
        </interfaceReference>
      </interfacereferences>
    </implementation>
  </implements>
</serviceModel>