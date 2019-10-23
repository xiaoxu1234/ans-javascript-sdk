import { temp } from '../../lib/mergeRules/index.js'
import { fillField, clearCache, isStartUp, checkBase, checkPrivate } from '../../lib/fillField/index.js'
import { errorLog } from '../../lib/printLog/index.js'
import baseConfig from '../../lib/baseConfig/index.js'
import { upLog } from '../../lib/upload/index.js'
import Util from '../../lib/common/index.js'
import { hashPageView } from './pageView.js'
import Storage from '../../lib/storage/index.js'

function startUp() {
    var log = []
    //启动前检测appkey、debugModel、uploadURL参数是否合法
    if (!checkBase()) {
        errorLog()
        return
    }
    var arkSuper = Storage.getLocal('ARKSUPER') || {}
    //检测启动前状态,appid，debugModel,uploadURL是否存在修改
    //判断是否是已启动
    //如已启动则不发送启动日志
    if (isStartUp() === false) {
        baseConfig.status.FnName = '$startup'
        //更新当前所在事件
        // baseConfig.status.FnName = '$startup'

        //获取事件日志模板
        var startUpTemp = temp('$startup')
        //验证及填充日志模板中字段内容
        //如未通过验证则返回值为fasle
        var startUpLog = fillField(startUpTemp)

        startUpLog = Util.objMerge({ 'xcontext': arkSuper }, startUpLog)
        log.push(Util.delEmpty(startUpLog))
    }




    //自动采集首次用户属性
    var fristProfile = Storage.getLocal('ARKFRISTPROFILE') || false
    if (baseConfig.base.autoProfile === true && !fristProfile) {
        baseConfig.status.FnName = '$profile_set_once'
        var profileSetOnceTemp = temp('$profile_set_once')

        var profileSetOnceObj = fillField(profileSetOnceTemp)
        var time = Util.format(new Date(), 'yyyy-MM-dd hh:mm:ss.SSS')
        var obj = {
            '$first_visit_time': time,
            '$first_visit_language': (navigator.language || navigator.browserLanguage).toLowerCase()
        }
        var profileSetOnceLog = Util.objMerge(profileSetOnceObj, { 'xcontext': obj })
        log.push(Util.delEmpty(profileSetOnceLog))
        Storage.setLocal('ARKFRISTPROFILE', time)
    }

    //自动采集页面
    if (baseConfig.base.auto === true) {
        //获取事件日志模板
        baseConfig.status.FnName = '$pageview'
        var pageViewTemp = temp('$pageview')
        var pageViewObj = fillField(pageViewTemp)
        pageViewObj = Util.objMerge({ 'xcontext': arkSuper }, Util.delEmpty(pageViewObj))
        var pageProperty = baseConfig.base.pageProperty
        var status = true
        if (!Util.isEmptyObject(pageProperty)) {
            //检测distinctId
            checkPrivate(pageProperty)
            // baseConfig.status.FnName = '$pageview'

            pageViewObj = Util.objMerge(pageViewObj, { 'xcontext': pageProperty })
        }

        //去除空数据后上传数据
        if (status) {
            log.push(pageViewObj)

        }
    }
    if (log.length > 0) {
        upLog(log)
    }
    //校准时间

    //开启hash跳转
    if (baseConfig.base.hash === true) {

        hashPageView()
    }
}
export { startUp, clearCache }