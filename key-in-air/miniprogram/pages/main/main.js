const QQMapWX = require('../../lib/qqmap-wx-jssdk.min.js');
const crypto = requirePlugin("crypto");
import GPS from '../../lib/gps.js';
let qqmapsdk;
Page({
  data: {
    cmdList: [
      {
        code: '00101',
        name: '门锁',
      },
      {
        code: '00101',
        name: '车窗',
      },
      {
        code: '00101',
        name: '天窗',
      },
      {
        code: '00101',
        name: '后备箱',
      },
      {
        code: '00101',
        name: '远程降温',
      },
      {
        code: '00101',
        name: '远程升温',
      },
    ],
    isServicing: '',
    isSuccess: '',
    userInfo: {
      ownerName: '',
      vin: '',
    },
    longitude: '',
    latitude: '',
    markers: [{
      id: 0,
      latitude: '',
      longitude: '',
      width: 50,
      height: 50
    }],
    address: '',
    bluetoothStatus: 'close',
    bluetoothTips: '开启蓝牙钥匙',
    isTimeOut: false,    // timeout
    isGetRes: false,  // get res
    connDeviceId: '', 
    connServiceId: '', 
    serviceCharUuid: '6E400001-B5A3-F393-E0A9-E50E24DCCA9E',  //服务uuid
    fwriteCharUuid: '6E400004-B5A3-F393-E0A9-E50E24DCCA9E',  //一级鉴权写入特征uuid
    freadCharUuid: '6E400005-B5A3-F393-E0A9-E50E24DCCA9E',  //一级鉴权读取特征uuid
    swriteCharUuid: '6E400002-B5A3-F393-E0A9-E50E24DCCA9E',  //二级鉴权写入特征uuid
    sreadCharUuid: '6E400003-B5A3-F393-E0A9-E50E24DCCA9E',  //二级鉴权读取特征uuid
    keyGet: 'p7465z9efbm7',
    codeGet: '2y7wqirvdldqb14f',
    nameGet: 'zn0zdq8czyxvt4i',
  },
  onLoad: function (option) {
    qqmapsdk = new QQMapWX({
      key: 'FZMBZ-EVEKP-BQSDV-VIU7K-RC2S3-2TBRB'
    });
    wx.getLocation({
      type: "wgs84",
      success: (res) => {
        const latlon = GPS.gcj_encrypt(res.latitude, res.longitude);
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: latlon.lat,
            longitude: latlon.lon,
          },
          success: (res) => {
            this.setData({
              latitude: latlon.lat,
              longitude: latlon.lon,
              markers: [{
                latitude: latlon.lat,
                longitude: latlon.lon,
              }],
              address: res.result.address,
              userInfo: {
                ownerName: option.ownerName || '张钙',
                vin: option.vin || 'LGG8D3D11JZ455645',
              }
            })
          }
        });
      }
    });
  },
  sendCmdHander() {
    this.setData({
      isServicing: true,
    });
    setTimeout(() => {
      if(Math.random() >= 0.5){
        this.setData({
          isSuccess: true,
        });
      }else{
        this.setData({
          isSuccess: false,
        });
      }
    }, 5000);
    setTimeout(() => {
      this.setData({
        isServicing: '',
        isSuccess: '',
      });
    }, 7000);
  },
  switchBluetooth() {
    const that = this;
    let keyGet = `p7465z9efbm7`, nameGet = 'zn0zdq8czyxvt4i', codeGet = '2y7wqirvdldqb14f';
    let timeDown = 60;
    let timer = null;
    let connDeviceId, connCharacteristicsId, connServiceId;
    if (this.data.bluetoothStatus === 'close'){
      const queryParams = {
        vin: '6YJSA1E40WUAAAAA1',
        accountId: 582,
      };
      const url = `https://clw-weixinxcx.dflzm.com/vehicle-bluetooth/bluetooth/getBluetooth?vin=${queryParams.vin}&accountId=${queryParams.accountId}`;
      // wx.request({
      //   url: url,
      //   success: (res) => {
      //     if (res.data.status === 'SUCCEED') {
      //       nameGet = res.data.name;
      //       keyGet = res.data.bleKey;
      //       codeGet = res.data.authCode;
      //       this.setData({
      //          keyGet: res.data.bleKey,
      //          codeGet: res.data.authCode,
      //        });
      //     }
      //   }
      // });
      this.setData({
        bluetoothStatus: 'ing',
        bluetoothTips: '蓝牙钥匙开启中',
      });
      wx.openBluetoothAdapter({
        success(res) {
          wx.getBluetoothAdapterState({
            success(res) {
              wx.startBluetoothDevicesDiscovery({
                allowDuplicatesKey: false,
                success: (res) => {
                  timer = setInterval(() => {
                    if (!that.data.isGetRes) {
                      if (timeDown <= 0) {
                        clearInterval(timer);
                        wx.showToast({
                          title: '未找到相对应的蓝牙名称',
                          icon: 'error',
                          duration: 2000
                        });
                        wx.stopBluetoothDevicesDiscovery({
                          success(res) {
                            console.log('timeout');
                            that.setData({
                              isTimeOut: true,
                              bluetoothStatus: 'close',
                              bluetoothTips: '连接超时',
                            })
                          }
                        });
                      } else {
                        timeDown--;
                      }
                    }
                  }, 1000);
                  wx.onBluetoothDeviceFound((res) => {
                    if (res.devices.length) {
                      let dataArr = res.devices.filter(item => {
                        return item.name === nameGet
                      });
                      if (dataArr.length && !that.data.isTimeOut) {
                        wx.stopBluetoothDevicesDiscovery({
                          success(res) {
                            console.log(res)
                          }
                        });
                        connDeviceId = dataArr[0].deviceId;
                        that.setData({
                          isGetRes: true,
                          connDeviceId: connDeviceId,
                        });
                        wx.createBLEConnection({
                          deviceId: connDeviceId,
                          success(res) {
                            if (res.errCode === 0) {
                              wx.showToast({
                                title: '蓝牙连接成功',
                                icon: 'error',
                                duration: 2000
                              });
                              wx.getBLEDeviceServices({
                                deviceId: connDeviceId,
                                success(res) {
                                  connServiceId = res.services[0].uuid;
                                  that.setData({
                                    connServiceId: res.services[0].uuid,
                                  });
                                  wx.getBLEDeviceCharacteristics({
                                    deviceId: connDeviceId,
                                    serviceId: connServiceId,
                                    success: (res) => {
                                      console.log(res);
                                      that.fWriteHander(); 
                                    },
                                    fail: () => {
                                      console.log('获取蓝牙特征失败');
                                    }
                                  })
                                },
                                fail: () => {
                                  console.log('获取已连接的蓝牙失败');
                                }
                              })
                            } else {
                              wx.showToast({
                                title: '蓝牙连接失败',
                                icon: 'error',
                                duration: 2000
                              });
                            }
                          },
                          fail() {
                            wx.showToast({
                              title: '蓝牙连接失败',
                              icon: 'error',
                              duration: 2000
                            });
                          }
                        })
                      }
                    }
                  })
                },
                fail() {
                  wx.showToast({
                    title: '搜索蓝牙信号失败',
                    icon: 'error',
                    duration: 2000
                  });
                }
              });
            },
            fail() {
              wx.showToast({
                title: '请检查蓝牙是否开启',
                icon: 'error',
                duration: 2000
              });
            }
          })
        },
        fail() {
          wx.showToast({
            title: '初始化蓝牙适配器失败',
            icon: 'error',
            duration: 2000
          });
        }
      });
    } else if (this.data.bluetoothStatus === 'open'){
      this.setData({
        bluetoothStatus: 'ing',
        bluetoothTips: '蓝牙钥匙关闭中',
      });
      wx.closeBluetoothAdapter({
        success(res) {
          that.setData({
            bluetoothStatus: 'close',
            bluetoothTips: '开启蓝牙钥匙',
          });
        }
      })
    } else {
      wx.showToast({
        title: '请稍等...',
        icon: 'success',
        duration: 2000
      });
    }
  },
  //一级鉴权写入
  fWriteHander() {
    let buffer = new ArrayBuffer(4);
    let dataView = new DataView(buffer);
    dataView.setUint8(0, '0x01');
    dataView.setUint8(0, '0x01');
    dataView.setUint16(0, this.data.keyGet);
    console.log('buffer', buffer);
    wx.writeBLECharacteristicValue({
      deviceId: this.data.connDeviceId,
      serviceId: this.data.connServiceId,
      characteristicId: this.data.fwriteCharUuid,
      value: buffer,
      success: (res) => {
        if (res.errCode === 0) {
          console.log('一级鉴权写入成功');
          this.fReadHander();
        } else {
          console.log('一级鉴权写入失败');
        }
      },
      fail: err => {
        console.log('一级鉴权写入失败', err);
      }
    })
  },
  //一级鉴权读取
  fReadHander() {
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: this.data.connDeviceId,
      serviceId: this.data.connServiceId,
      characteristicId: this.data.freadCharUuid,
      success: (res) => {
        console.log(res);
        wx.readBLECharacteristicValue({
          deviceId: this.data.connDeviceId,
          serviceId: this.data.connServiceId,
          characteristicId: this.data.freadCharUuid,
          success(res) {
            console.log('一级鉴权读取结果', res);
            if (res.errCode === 0) {
              console.log('一级鉴权读取成功');
              this.sWriteHander();
            } else {
              console.log('一级鉴权读取失败', err);
            }
          },
          fail: err => {
            console.log('一级鉴权读取失败', err);
          }
        });
      },
      fail: () => {
        console.log('一级鉴权读取不支持notify功能');
      }
    });
  },
  //二级鉴权写入
  sWriteHander() {
    const mi = new crypto.AES().encrypt(this.data.codeGet, this.data.keyGet, {
      iv: 8,
      mode: crypto.Mode['ECB'],
      padding: crypto.Padding['NoPadding']
    });
    console.log('encrypt:', mi.toString());
    wx.writeBLECharacteristicValue({
      deviceId: this.data.connDeviceId,
      serviceId: this.data.connServiceId,
      characteristicId: this.data.swriteCharUuid,
      value: mi.toString(),
      success: (res) => {
        if (res.errCode === 0) {
          console.log('二级鉴权写入成功');
          this.sReadHander();
        } else {
          console.log('二级鉴权写入失败');
        }
      },
      fail: err => {
        console.log('二级鉴权写入失败', err);
      }
    })
  },
  //二级鉴权读取
  sReadHander() {
    wx.notifyBLECharacteristicValueChange({
      state: true,
      deviceId: this.data.connDeviceId,
      serviceId: this.data.connServiceId,
      characteristicId: this.data.sReadCharUuid,
      success: (res) => {
        console.log(res);
        wx.readBLECharacteristicValue({
          deviceId: this.data.connDeviceId,
          serviceId: this.data.connServiceId,
          characteristicId: this.data.sReadCharUuid,
          success(res) {
            console.log('二级鉴权读取结果', res);
            if (res.errCode === 0) {
              console.log('二级鉴权读取成功');
              that.setData({
                bluetoothStatus: 'open',
                bluetoothTips: '关闭蓝牙钥匙',
              });
            } else {
              console.log('二级鉴权读取失败', err);
            }
          },
          fail: err => {
            console.log('二级鉴权读取失败', err);
          }
        });
      },
      fail: () => {
        console.log('二级鉴权读取不支持notify功能');
      }
    });
  },
})
